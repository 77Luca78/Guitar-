# Luca Guitar Quest – Premium Stable

## Technische Verbesserungen

- `mic-pro.js` wird direkt aus `index.html` geladen.
- Die fehleranfällige Script-Injektion durch den Service Worker wurde entfernt.
- Der Offline-Cache wurde auf eine robuste Version umgestellt.
- Optionale Bilder können die Service-Worker-Installation nicht mehr vollständig blockieren.
- Alte App-Caches werden bei einem Update kontrolliert entfernt.
- JavaScript- und CSS-Dateien werden online aktualisiert und offline weiterhin bereitgestellt.
- Fehler bei der Service-Worker-Registrierung werden sichtbar protokolliert.
- Temporäre Audio-URLs gespeicherter Aufnahmen werden freigegeben.
- Aufräumen der Audio-URLs beim Schließen der App wurde ergänzt.

## Visuelle Verbesserungen

- moderner Premium-Dark-Mode
- transparentere, ruhigere Kopf- und Navigationsbereiche
- bessere Kontraste und Fokusmarkierungen
- modernisierte Bottom-Navigation
- optimierte Abstände für iPhone und iPad
- Unterstützung der Safe-Area auf Geräten mit Home-Indikator
- reduzierte Animationen bei entsprechender Systemeinstellung

## Prüfung

- `app.js`: Syntaxprüfung bestanden
- `mic-pro.js`: Syntaxprüfung bestanden
- `service-worker.js`: Syntaxprüfung bestanden
- `manifest.json`: gültiges JSON
- alle lokalen Dateien aus `index.html`: vorhanden

## Installation

Die Dateien aus diesem Ordner in das Hauptverzeichnis des GitHub-Repositories hochladen.
Danach GitHub Pages neu laden. Bei einer bereits installierten PWA die App einmal vollständig
schließen und erneut öffnen, damit der neue Service Worker aktiv wird.

## Wichtiger Praxistest

Mikrofon, Stimmgerät und Aufnahme müssen zusätzlich auf dem tatsächlichen iPad beziehungsweise
iPhone getestet werden. Eine statische Codeprüfung kann reale Mikrofonhardware und Safari-
Berechtigungen nicht vollständig simulieren.
