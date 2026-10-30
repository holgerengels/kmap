# KMap Deployment

Deployment-Workflow für KMap basierend auf Docker-Images in der GitHub Container Registry (`ghcr.io/holgerengels/kmap-*`), analog zu **synx** und **tix**.

---

## 1. Registry Login (einmalig lokal)

Um Images in die GitHub Container Registry zu pushen, führe lokal aus:

```bash
deploy/login.sh
```

Hierfür wird ein GitHub Personal Access Token (PAT) mit dem Scope `write:packages` benötigt ([Token erstellen](https://github.com/settings/tokens/new?scopes=write:packages,read:packages,delete:packages)).

---

## 2. Images bauen und pushen

### Alle Images bauen & pushen:
```bash
deploy/build_and_push.sh
```

### Einzelne Komponenten bauen & pushen:
```bash
deploy/build_and_push.sh server      # Nur kmap-server (Java WAR / Jetty 11)
deploy/build_and_push.sh frontend    # Nur kmap-frontend (Client SPA / Nginx)
deploy/build_and_push.sh snappy      # Nur kmap-snappy (Puppeteer Screenshot Service)
deploy/build_and_push.sh couchdb     # Nur kmap-couchdb (CouchDB mit jq)
```

---

## 3. Deployment auf dem Server

Auf dem Server muss die Datei `deploy/docker-compose.yml` liegen (bzw. im KMap-Deployment-Verzeichnis).

### Aktualisieren & Starten:
```bash
# Images von ghcr.io ziehen:
docker compose pull

# Container neu starten:
docker compose up -d
```

### Nur eine einzelne Komponente aktualisieren (z.B. nur Server oder Frontend):
```bash
docker compose pull kmap-server
docker compose up -d kmap-server
```

---

## 4. Konfiguration (`config/`)

Konfiguration und Secrets sind **weder im Git noch in den Images** (siehe `.dockerignore`). Sie liegen auf dem Server in einem Verzeichnis `config/` neben der `docker-compose.yml` und werden schreibgeschützt als `/config` in `kmap-server` und `kmap-snappy` gemountet:

```
kmap/
├── docker-compose.yml
└── config/
    ├── config.json          # Abschnitte "server" und "snappy"
    ├── trustStore           # für LDAPS (JAVA_OPTIONS in docker-compose.yml)
    └── <instance>-users.csv # z.B. root-users.csv
```

* Vorlage: [`config/config.example.json`](../config/config.example.json) im Repo.
* Der Abschnitt `server` wird intern auf die bekannten Keys mit Punkt abgebildet (`{"mail":{"smtp":{"host":…}}}` → `mail.smtp.host`).
* `auth.csv` und `auth.trustStore` zeigen standardmäßig auf das Verzeichnis der `config.json` und müssen im Container nicht angegeben werden.
* `kmap-snappy` übernimmt die Mongo-Einstellungen aus `server.mongo`, wenn `snappy.mongo` fehlt.
* Der Container läuft als User `jetty`, die Dateien müssen für ihn lesbar sein (z.B. `chmod 644`, das Verzeichnis `755`).
* Nach Änderungen: `docker compose restart kmap-server kmap-snappy`.

### Einmalige Umstellung vom alten `kmap_jetty`-Volume

```bash
mkdir -p config
docker run --rm -v kmap_jetty:/from -v "$PWD/config":/to alpine cp -a /from/. /to/
cp /pfad/zu/config.example.json config/config.json   # dann Werte/Secrets eintragen
```

### Lokale Entwicklung

* `kmap/config/config.json` (gitignored) wird von `mvn jetty:run` automatisch verwendet (`-Dkmap.config` in `server/pom.xml`).
* Andere Run-Configs (z.B. IntelliJ): `-Dkmap.config=/home/…/kmap/config/config.json` oder Umgebungsvariable `KMAP_CONFIG`.
* Snappy findet `kmap/config/config.json` ohne weitere Einstellung.

---

## 5. Daten & Volumes

* **MongoDB:** Volume `kmap_mongodb`. Beim Pullen neuer Images und Neustarten (`docker compose pull && docker compose up -d`) bleiben die Daten erhalten.
* **Snappy:** Volume `kmap_snappy` für die Screenshots.
* **SSL-Zertifikate:** Werden auf dem Server über das Host-Volume `/etc/nginx/ssl` schreibgeschützt (`:ro`) in `kmap-frontend` eingebunden.
