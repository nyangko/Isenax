<div align="center">

<img src="../assets/banner.png" alt="Isenax - Isometrisches Diagramm-Werkzeug" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## Hinweis:

Dieses Repository (Isenax) ist ein Derivat von [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW), das selbst ein Fork von stan-smith/FossFLOW ist (der wiederum ein Fork von [markmanx/isoflow](https://github.com/markmanx/isoflow) war), ursprünglich erstellt, um über PRs zum Original-Repository beizutragen. Der GitHub-Benutzername des Autors scheint jedoch zu [mug-book-droid](https://github.com/mug-book-droid) geändert worden zu sein, und seine Aktivität wurde auf privat gesetzt (vielleicht wurde das Konto gesperrt?), wodurch das Original-Repository unzugänglich wurde.

Vorerst beabsichtige ich, dieses Repository (jetzt Isenax genannt) als Fortsetzung der Entwicklung von FossFLOW zu führen, und jeder Beitrag über PRs ist ebenfalls willkommen.

Den letzten Stand des Original-Repositorys, den ich abgerufen habe, findest du im Branch `backup/stan-smith-FossFLOW`.

---

Isenax ist eine leistungsstarke, quelloffene Progressive Web App (PWA) zum Erstellen schöner isometrischer Diagramme. Gebaut mit React und der <a href="https://github.com/markmanx/isoflow">Isoflow</a>-Bibliothek (geforkt und auf npm als fossflow veröffentlicht, und in diesem Fork als isenax), läuft sie vollständig in deinem Browser mit Offline-Unterstützung.

---
<p align="center">
<b>Online ausprobieren --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Schnelle Bereitstellung mit Docker

```bash
# Mit Docker Compose (empfohlen - beinhaltet persistenten Speicher)
docker compose up

# Oder direkt von Docker Hub mit persistentem Speicher ausführen
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Server-Speicher ist in Docker standardmäßig aktiviert. Deine Diagramme werden (standardmäßig als root) in `./diagrams` auf dem Host gespeichert. Um den Benutzer oder die Gruppen-ID zum Speichern zu ändern, setze die Umgebungsvariablen `PUID` und `PGID`.

Um den Server-Speicher zu deaktivieren, setze `ENABLE_SERVER_STORAGE=false`:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### HTTP Basic Authentication (Optional)

Schütze deine Isenax-Instanz mit HTTP Basic Auth:

```bash
# Mit Docker Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# Oder mit docker run
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **Hinweis**: Beide Variablen müssen gesetzt sein, um die Authentifizierung zu aktivieren. Ist eine davon leer, ist die App ohne Login zugänglich.

## Schnellstart (Lokale Entwicklung)

```bash
# Repository klonen
git clone https://github.com/nyangko/Isenax
cd Isenax

# Abhängigkeiten installieren
npm install

# Bibliothek bauen (beim ersten Mal erforderlich)
npm run build:lib

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser.

## Monorepo-Struktur

Dies ist ein Monorepo mit drei Paketen:

- `packages/isenax-lib` - React-Komponentenbibliothek zum Zeichnen von Netzwerkdiagrammen (gebaut mit Rslib/Rspack)
- `packages/isenax-app` - Progressive Web App, die die Bibliothek umhüllt und präsentiert (gebaut mit RSBuild)
- `packages/isenax-backend` - Express-Server, der optionalen selbst gehosteten Speicher für Diagramme bereitstellt (verwendet im Docker-Deployment)

### Entwicklungsbefehle

```bash
# Entwicklung
npm run dev          # App-Entwicklungsserver starten
npm run dev:lib      # Watch-Modus für Bibliotheksentwicklung

# Bauen
npm run build        # Bibliothek und App bauen
npm run build:lib    # Nur Bibliothek bauen
npm run build:app    # Nur App bauen

# Testen & Linting
npm test             # Unit-Tests ausführen
npm run lint         # Auf Linting-Fehler prüfen

# E2E-Tests (Selenium)
cd e2e-tests
./run-tests.sh       # End-to-End-Tests ausführen (erfordert Docker & Python)

# Veröffentlichen
npm run publish:lib  # Bibliothek auf npm veröffentlichen
```

## Verwendung

### Diagramme erstellen

1. **Elemente hinzufügen**:
   - Drücke die "+"-Taste im Menü oben rechts, die Komponentenbibliothek erscheint links
   - Ziehe Komponenten per Drag-and-Drop aus der Bibliothek auf die Leinwand
   - Oder klicke mit der rechten Maustaste auf das Raster und wähle "Knoten hinzufügen"

2. **Elemente verbinden**:
   - Wähle das Verbindungswerkzeug (drücke 'C' oder klicke auf das Verbindungssymbol)
   - **Klick-Modus** (Standard): Klicke auf den ersten Knoten, dann auf den zweiten
   - **Zieh-Modus** (optional): Klicke und ziehe vom ersten zum zweiten Knoten
   - Wechsle den Modus in Einstellungen → Verbindungen

3. **Arbeit speichern**:
   - **Schnellspeichern** - Speichert in der Browser-Sitzung
   - **Exportieren** - Als JSON-Datei herunterladen
   - **Importieren** - Aus JSON-Datei laden

4. **Mit dem Ebenen-Panel organisieren**:
   - Öffne „Ebenen“ in der Symbolleiste, um alle Knoten, Verbinder, Bereiche und Textfelder in einer Liste zu sehen
   - Wähle dort ein Element aus, um es im Tab „Bearbeiten“ desselben Panels zu bearbeiten
   - Auf schmalen Bildschirmen öffnet es sich als Bottom Sheet über die Schaltfläche unten rechts auf der Arbeitsfläche

### Speicheroptionen

- **Sitzungsspeicher**: Temporäre Speicherungen, die beim Schließen des Browsers gelöscht werden
- **Export/Import**: Permanente Speicherung als JSON-Dateien
- **Automatisches Speichern**: Speichert Änderungen automatisch alle 5 Sekunden in der Sitzung

## Kürzlich hinzugefügt

### Konnektor-Multiplexing
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### Elemente kopieren und einfügen
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## Beitragen

Wir freuen uns über Beiträge! Siehe [CONTRIBUTING.md](../CONTRIBUTING.md) für Richtlinien.

## Dokumentation

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - Umfassender Leitfaden zur Codebase
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Beitragsrichtlinien

## Lizenz

MIT
