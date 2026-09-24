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

## 4. Datenbank- & Datensicherheit

* **CouchDB-Volume:** In `deploy/docker-compose.yml` ist das Volume explizit an das bestehende Volume `name: kmap_couchdb` gebunden. 
* Beim Pullen neuer Images und Neustarten (`docker compose pull && docker compose up -d`) bleiben alle Daten in der CouchDB vollständig erhalten.
* **Jetty & Snappy Volumes:** Werden analog über die bestehenden Volumes `kmap_jetty` und `kmap_snappy` eingebunden.
* **SSL-Zertifikate:** Werden auf dem Server über das Host-Volume `/etc/nginx/ssl` schreibgeschützt (`:ro`) in `kmap-frontend` eingebunden.
