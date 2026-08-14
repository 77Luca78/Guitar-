# Testbericht · Luca Guitar Quest 5.1.1

## Automatisch bestanden

- JavaScript-Syntax von `app.js`, `mic-pro.js`, `service-worker.js` und dem eingebetteten Practice-Lab-Code
- JSON-Syntax von Manifest und persönlichem Katalog
- Vollständigkeit aller für den Start benötigten Dateien
- gültige lokale Verweise und eindeutige HTML-IDs
- keine automatisch geladenen externen Medien
- PWA-Manifest, Startadresse, Scope, Maskable Icon und Practice-Lab-Shortcut
- 22 mitgelieferte spielbare Übungen mit Spieldaten
- 151 persönliche Referenz-Templates
- synthetische Tonhöhenerkennung über alle sechs Gitarrensaiten
- Parser für ChordPro, Text-/ASCII-Tab und Luca-JSON
- lokale Kalendertagsberechnung für den Übungsfortschritt
- Mikrofon-Korrekturen für Lernmodus, Auto-Aufnahme und Speicherfreigabe
- Service-Worker-Installation mit vollständigem Kerncache
- Offline-Navigation zur Haupt-App und zum Spotify Practice Lab, auch mit PWA-Shortcut-Parametern
- sichere Cache-Aktualisierung: alte eigene Caches werden entfernt, fremde Caches bleiben erhalten
- Service-Worker-Fallbacks berücksichtigen URL-Parameter und den Practice-Lab-Pfad
- Formularfelder besitzen zugängliche Beschriftungen

## Noch am echten Gerät zu bestätigen

In der aktuellen Entwicklungsumgebung war kein kompatibler Browser für eine vollständige visuelle Browserautomation installiert. Hardwareabhängige Punkte können ohnehin nur auf den Zielgeräten verlässlich abgenommen werden:

- Mikrofonfreigabe, Empfindlichkeit und Latenz auf dem iPad Pro
- Mikrofonfreigabe auf dem Xiaomi-Gerät
- Installation zum Home-Bildschirm
- tatsächlicher Offline-Start im Flugmodus
- Audio-Ausgabe und Aufnahme-Wiedergabe über die verwendeten Lautsprecher/Kopfhörer

Die dafür vorgesehenen Schritte stehen in `DEVICE_TEST.md`.

