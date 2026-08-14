# Luca Guitar Quest · Unified 5.1.1

Die verbindliche Hauptversion von Luca Guitar Quest. Sie vereint den animierten Interactive-Play-Modus, Mikrofontraining, Offline-PWA, persönliche Übungen und das Spotify Practice Lab in einer einzigen direkt nutzbaren App.

## Enthalten

- vertikale Sechs-Saiten-Spielspur mit Lern-, Übungs-, Spiel- und Kita-Modus
- Countdown, Timing-Wertung, Serie, schwierige Stelle, A/B-Loop und adaptive Tempoempfehlung
- Mikrofonmodus mit Stimmgerät, Latenzmessung, Empfindlichkeit, Auto-Aufnahme und Wiedergabe
- 22 vollständig spielbare Übungen sowie 151 persönliche Referenz-Templates
- Import für Luca-JSON, ChordPro und Text-/ASCII-Tabs
- Spotify Practice Lab mit lokalem Übungsfortschritt und optionalen Spotify-Links
- lokale Sicherung und Wiederherstellung der App-Daten
- installierbare Offline-PWA für iPad und Android/Xiaomi

Die Kern-App benötigt weder API-Schlüssel noch Abo, Cloud-Guthaben, eigenes Backend oder Anmeldung. Spotify wird nur über bewusst geöffnete Links verwendet; die App lädt keine fremden Medien automatisch.

## Installation über GitHub Pages

1. Dieses ZIP entpacken und **alle enthaltenen Dateien direkt** in das Hauptverzeichnis des GitHub-Repositories `luca-guitar-quest` hochladen. `index.html` muss im Repository-Hauptverzeichnis liegen.
2. In GitHub unter **Settings → Pages** als Quelle **Deploy from a branch**, Branch **main** und Ordner **/(root)** wählen, speichern und anschließend `https://77luca78.github.io/luca-guitar-quest/` öffnen.
3. Die Seite beim ersten Start online vollständig laden. Auf dem iPad in Safari **Teilen → Zum Home-Bildschirm**, auf Xiaomi in Chrome **App installieren/Zum Startbildschirm** wählen, Mikrofon erlauben und danach den Flugmodus-Test aus `DEVICE_TEST.md` durchführen.

## Wichtige Dateien

- `index.html` – Haupt-App
- `spotify-practice.html` – Spotify Practice Lab
- `app.js` – Übungen, Player, Import, Fortschritt und Sicherung
- `mic-pro.js` – Mikrofon-, Stimm- und Aufnahmefunktionen
- `service-worker.js` – Offline-Cache
- `personal_catalog.json` – persönlicher Referenzkatalog
- `DEVICE_TEST.md` – kurzer echter Geräte-Abnahmetest
- `TEST_REPORT.md` – dokumentierte automatische Prüfungen und offene Gerätetests

## Aktualisierung einer installierten PWA

Nach einem GitHub-Pages-Update die installierte App vollständig aus dem App-Umschalter schließen und neu öffnen. Falls weiterhin eine alte Version erscheint, die Website-Daten der GitHub-Pages-Adresse einmal löschen und die App erneut zum Home-Bildschirm hinzufügen.

Version: **5.1.1**

