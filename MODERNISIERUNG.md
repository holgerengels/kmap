# Modernisierung kmap-server

Ziel: Der Server wird schlanker, nutzt einen aktuellen Stack und ist einfacher zu betreiben. Es gibt **keinen** Framework-Wechsel, die Servlets bleiben im Kern unverändert.

| | heute | danach |
|---|---|---|
| Build | Maven, `war` | Maven, `jar` + `lib/` |
| Laufzeit | Jetty 11 (Community-Support beendet) als Container, WAR-Deployment | Embedded Jetty 12 (ee10, Servlet 6.0), `java -jar` |
| Konfiguration | `web.xml` + `jetty-web.xml` | eine Klasse `kmap.Main` |
| Docker-Basis | `jetty:11-jre21-alpine` | `eclipse-temurin:21-jre-alpine` (später 25) |
| Threads | Plattform-Threads | optional virtuelle Threads |

Was sich **nicht** ändert: URLs (`/server/...`), Port 8080, nginx-Konfiguration, `config.json`, Frontend, snappy, MongoDB.

---

## Phase 0 – Voraussetzung (vor dem Start)

- [ ] Der Branch `mongodb` ist in Produktion und läuft einige Wochen stabil.
- [ ] Das aktuelle Produktiv-Image wird zusätzlich getaggt, damit ein Rollback möglich ist:
  ```bash
  docker tag ghcr.io/holgerengels/kmap-server:latest ghcr.io/holgerengels/kmap-server:jetty11
  docker push ghcr.io/holgerengels/kmap-server:jetty11
  ```
- [x] `jakarta.servlet-api` in der `pom.xml` von `6.0.0` auf `5.0.0` gesetzt (passend zu Jetty 11). Kompiliert, alle 23 Tests grün. **In Phase 2 wieder auf 6.0 gehen** (bzw. transitiv über Jetty 12 ee10).

---

## Phase 1 – Abhängigkeiten aufräumen (ca. 1–2 h, geringes Risiko)

Läuft noch auf Jetty 11 und kann separat deployt werden.

- [ ] **`javax:javaee-web-api:8.0.1` entfernen.** Die Abhängigkeit steht im Scope `compile` und landet deshalb als Ballast im WAR. Der Code nutzt nur `jakarta.servlet`.
- [ ] **`org.glassfish:javax.json` entfernen.** Sie wird nur in [JsonLD.java](server/src/main/java/kmap/JsonLD.java) genutzt; dort auf Gson umstellen. Alle übrigen 35 Klassen nutzen bereits Gson.
- [ ] **Apache `httpclient`/`httpcore` 4.x entfernen.** Sie werden nur von [IdleConnectionMonitor.java](server/src/main/java/kmap/IdleConnectionMonitor.java) genutzt, und diese Klasse wird nirgends verwendet. Die Klasse löschen. Falls künftig HTTP-Aufrufe nötig sind: `java.net.http.HttpClient` (im JDK enthalten).
- [ ] **Toten Code entfernen:** `context.path` wird in [JsonServlet.java](server/src/main/java/kmap/JsonServlet.java#L22) gesetzt, aber nirgends gelesen.
- [ ] **Versionen aktualisieren:**
  ```bash
  cd server && mvn versions:display-dependency-updates versions:display-plugin-updates
  ```
  Kandidaten: gson, jsoup, commons-io, batik, opencsv, mongodb-driver, junit, Maven-Plugins.
  `com.sun.mail:jakarta.mail 2.0.1` → `org.eclipse.angus:angus-mail` (der Nachfolger).
- [ ] *(Optional)* Namen aus CouchDB-Zeiten (`Couch`, `CouchDBAuthConnection`) umbenennen oder entfernen, soweit sie nach der Migration nicht mehr passen.
- [ ] Tests laufen lassen, Image bauen, deployen.

---

## Phase 2 – Embedded Jetty 12 (ca. ½–1 Tag)

### 2.1 `pom.xml`

- [ ] `<packaging>war</packaging>` → `jar`
- [ ] `maven-war-plugin` und `jetty-maven-plugin` entfernen
- [ ] Jetty-BOM importieren (aktuellste 12.x zum Umsetzungszeitpunkt):
  ```xml
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.eclipse.jetty</groupId>
        <artifactId>jetty-bom</artifactId>
        <version>12.x.y</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>org.eclipse.jetty.ee10</groupId>
        <artifactId>jetty-ee10-bom</artifactId>
        <version>12.x.y</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
  ```
- [ ] Abhängigkeiten: `org.eclipse.jetty.ee10:jetty-ee10-servlet` (bringt `jetty-server` mit). `jakarta.servlet-api` von `provided` auf `compile` setzen bzw. weglassen, weil es transitiv kommt.
- [ ] **Packaging als dünnes JAR + `lib/`** statt Fat-JAR:
  - `maven-jar-plugin` mit `Main-Class: kmap.Main` und `Class-Path: lib/...` (`addClasspath`, `classpathPrefix=lib/`)
  - `maven-dependency-plugin` (`copy-dependencies` → `target/lib`)

  > Bewusst **kein** Shade/Fat-JAR: Batik und `webp-imageio` nutzen `META-INF/services` (ImageIO-SPI), und `webp-imageio` bringt native Bibliotheken im JAR mit. Beim Shaden geht das leicht kaputt. Außerdem cached Docker `lib/` als eigenen Layer, sodass Rebuilds nur das kleine App-JAR neu schreiben.

- [ ] Für die Entwicklung: `exec-maven-plugin` (`mvn exec:java`) mit `-Dkmap.config=${project.basedir}/../config/config.json`, oder `kmap.Main` direkt aus der IDE starten.

### 2.2 Neue Klasse `kmap.Main`

Ersetzt `web.xml` und `jetty-web.xml` 1:1. Skizze:

```java
package kmap;

import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.http.HttpServlet;
import org.eclipse.jetty.ee10.servlet.ServletContextHandler;
import org.eclipse.jetty.ee10.servlet.ServletHolder;
import org.eclipse.jetty.server.*;
import org.eclipse.jetty.util.thread.QueuedThreadPool;

import java.util.concurrent.Executors;

public class Main {
    private static final MultipartConfigElement MULTIPART =
            new MultipartConfigElement("", -1, -1, 52_428_800);

    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

        QueuedThreadPool threads = new QueuedThreadPool();
        threads.setVirtualThreadsExecutor(Executors.newVirtualThreadPerTaskExecutor()); // optional
        Server server = new Server(threads);

        HttpConfiguration http = new HttpConfiguration();
        http.addCustomizer(new ForwardedRequestCustomizer());   // hinter nginx: echte Client-IP
        http.setSendServerVersion(false);
        ServerConnector connector = new ServerConnector(server, new HttpConnectionFactory(http));
        connector.setPort(port);
        server.addConnector(connector);

        ServletContextHandler ctx = new ServletContextHandler(ServletContextHandler.SESSIONS);
        ctx.setContextPath("/server");
        ctx.setMaxFormContentSize(200_000_000);
        ctx.getSessionHandler().getSessionCookieConfig().setHttpOnly(true);
        ctx.getSessionHandler().getSessionCookieConfig().setSecure(true);

        add(ctx, EditServlet.class,           true,  "/edit");
        add(ctx, ContentManagerServlet.class, true,  "/content");
        add(ctx, DataServlet.class,           false, "/data", "/data/*");
        add(ctx, StateServlet.class,          false, "/state");
        add(ctx, TestsServlet.class,          true,  "/tests/*");
        add(ctx, IdentitiesServlet.class,     false, "/identities");
        add(ctx, FeedbackServlet.class,       false, "/feedback");
        add(ctx, IndexServlet.class,          false, "/index/*");
        add(ctx, RSSServlet.class,            false, "/feed/*");
        add(ctx, MundoServlet.class,          false, "/mundo/*");
        add(ctx, EduTagsServlet.class,        false, "/edutags/*");
        add(ctx, SitemapServlet.class,        false, "/sitemap/*");
        add(ctx, SEOServlet.class,            false, "/seo/*");
        add(ctx, SearchServlet.class,         false, "/search/*");
        add(ctx, AuthServlet.class,           false, "/auth");
        add(ctx, AIConnectorServlet.class,    false, "/aiconnector/*");

        server.setHandler(ctx);
        server.setStopAtShutdown(true);   // sauberes Herunterfahren bei docker stop
        server.setStopTimeout(10_000);
        server.start();
        server.join();
    }

    private static void add(ServletContextHandler ctx, Class<? extends HttpServlet> servlet,
                            boolean multipart, String... paths) {
        ServletHolder holder = new ServletHolder(servlet);
        holder.setInitOrder(1);           // init beim Start statt beim ersten Request → Konfigurationsfehler sofort sichtbar
        if (multipart)
            holder.getRegistration().setMultipartConfig(MULTIPART);
        for (String path : paths)
            ctx.addServlet(holder, path);
    }
}
```

> Hinweis zu `setInitOrder(1)`: Heute werden die Servlets erst beim ersten Request initialisiert. Mit `initOrder` scheitert der Start sofort, wenn z.B. `config.json` oder Mongo fehlen. Das ist gewollt, sollte aber bewusst getestet werden.

### 2.3 Code-Anpassungen in den Servlets

Es gibt nur zwei Stellen, die vom WAR-Dateisystem abhängen (`getRealPath`):

- [ ] [JsonServlet.java](server/src/main/java/kmap/JsonServlet.java#L22): Zeile `context.path` entfernen (siehe Phase 1).
- [ ] [IndexServlet.java](server/src/main/java/kmap/IndexServlet.java#L32): `index.html` wird nicht mehr über `getRealPath` geladen, sondern:
  - wenn die Property `index` gesetzt ist: als Datei von diesem Pfad,
  - sonst als Classpath-Ressource `/index.html` (`IndexServlet.class.getResourceAsStream`).

  Im Dockerfile wird `client/index.html` dann nach `server/src/main/resources/index.html` kopiert (statt nach `webapp/`).
- [ ] [IndexServletPathTest.java](server/src/test/java/kmap/IndexServletPathTest.java) entsprechend anpassen.
- [ ] Danach `src/main/webapp/` komplett löschen (`web.xml`, `jetty-web.xml`). Die lokalen, nicht versionierten Dateien `kmap.properties` und `serviceAccountKey.json` dort vorher prüfen und ggf. nach `config/` verschieben.

### 2.4 Docker

- [ ] [deploy/server.docker](deploy/server.docker) neu:
  ```dockerfile
  FROM maven:3.9-eclipse-temurin-21 AS builder
  WORKDIR /build/server
  COPY server/pom.xml .
  RUN mvn -q dependency:go-offline            # Dependency-Layer cachen
  COPY server/src ./src
  COPY client/index.html ./src/main/resources/index.html
  RUN mvn -q package -DskipTests

  FROM eclipse-temurin:21-jre-alpine
  RUN addgroup -S kmap && adduser -S kmap -G kmap
  WORKDIR /opt/kmap
  COPY --from=builder /build/server/target/lib ./lib
  COPY --from=builder /build/server/target/server.jar ./server.jar
  USER kmap
  EXPOSE 8080
  ENTRYPOINT ["java", "-Djava.awt.headless=true", "-jar", "server.jar"]
  ```
- [ ] In [deploy/docker-compose.yml](deploy/docker-compose.yml) `JAVA_OPTIONS` (eine Konvention des Jetty-Images) in **`JAVA_TOOL_OPTIONS`** umbenennen. Die JVM liest diese Variable selbst, es braucht kein Wrapper-Skript. Die Netzwerk-Aliase (`jetty`, `server`) bleiben, nginx muss nicht angepasst werden.
- [ ] [deploy/README.md](deploy/README.md) anpassen: „Java WAR / Jetty 11“ → „Embedded Jetty 12“. Der Container-User heißt dann `kmap` statt `jetty`; mit `chmod 644` auf `config/` reicht das weiterhin.

> ⚠️ **In Container testen:** `webp-imageio` (native Bibliothek) und Batik (Fonts) auf Alpine/musl. Beides läuft heute auf `jetty:11-jre21-alpine`, sollte also auch auf `temurin:21-jre-alpine` laufen. Das muss aber wirklich geprüft werden (SVG → WebP für die Meta-Header). Notfalls `eclipse-temurin:21-jre` (Debian-basiert) nehmen.

### 2.5 Testen

- [ ] Unit-Tests: `mvn test` (ConfigTest, IndexServletPathTest, SvgRasterizerTest, MongoIntegrationTest)
- [ ] **Neu und jetzt einfach möglich:** ein Integrationstest, der `Main`-Logik auf einem freien Port startet und einige Endpunkte per `java.net.http.HttpClient` abfragt. Mit dem WAR ging das nur umständlich.
- [ ] Smoke-Test gegen das neue Image im Dev-Setup, im Vergleich zum alten Image:
  - `/server/index/browser/...` (SEO-HTML, Meta-Header, WebP-Bild)
  - `/server/data?...` (Laden einer Karte)
  - Login/Logout über `/server/auth`; Session-Cookie hat `HttpOnly` und `Secure`
  - Upload über `/server/edit` bzw. `/server/content` (Multipart, große Dateien)
  - `/server/sitemap/...`, `/server/feed/...`, `/server/search/...`
  - Tests-Import über `/server/tests/*`
- [ ] Logs prüfen: Die Client-IP kommt korrekt über `X-Forwarded-For` an.
- [ ] Image-Größe und Startzeit mit dem alten Image vergleichen (nur zur Info).

### 2.6 Rollout & Rollback

- [ ] Image bauen und pushen, auf dem Server `docker compose pull kmap-server && docker compose up -d kmap-server`.
- [ ] Rollback: in `docker-compose.yml` das Image auf `:jetty11` setzen und `JAVA_TOOL_OPTIONS` zurück auf `JAVA_OPTIONS` ändern.

---

## Phase 3 – Optional / später

- [ ] **Java 25 (LTS)**: `<release>25</release>`, Basis-Images `maven:3.9-eclipse-temurin-25` und `eclipse-temurin:25-jre-alpine`. Das ist wenig Aufwand, sobald alle Abhängigkeiten mitziehen.
- [ ] **Image-Tags mit Version** statt nur `latest` in [build_and_push.sh](deploy/build_and_push.sh), z.B. Git-Hash oder Datum. Das macht Rollbacks trivial.
- [ ] **Healthcheck-Endpunkt** (`/server/health`) plus `healthcheck:` in der Compose-Datei.
- [ ] **Logging**: `System.out.println` → `System.Logger` (JDK) oder SLF4J, damit sich die Log-Menge per Level steuern lässt.

---

## Bewusst nicht vorgesehen

- **Gradle statt Maven**: kein Vorteil für dieses Projekt, Maven ist weiterhin Standard.
- **Spring Boot / Quarkus / Micronaut / Javalin**: würde ein Neuschreiben des Routings bedeuten, ohne Nutzen bei ~8.700 Zeilen und 18 Servlets. Embedded Jetty ist bereits die leichtgewichtigste sinnvolle Option.
- **Persistente Sessions**: Sessions liegen wie bisher im Speicher und gehen bei einem Neustart verloren. Am Verhalten ändert sich nichts.
