# Änderungsprotokoll

## 5.1.1 · Offline-Shortcut-Fix

- Service Worker robuster gemacht: gecachte Dateien werden nun auch bei URL-Parametern gefunden.
- Offline-Fallback für das Spotify Practice Lab korrigiert, damit der PWA-Shortcut `spotify-practice.html?source=pwa` offline auf die Practice-Lab-Seite statt auf die Haupt-App zurückfällt.
- App-, Manifest-, Cache- und Dokumentationsversion auf 5.1.1 vereinheitlicht.

## 5.1.0 · Konsolidierte Hauptversion

- Interactive Play 3.0.1 als funktionsstarke Spielerbasis übernommen
- Spotify Practice Lab aus Version 5 integriert und auf lokale Haupt-App-Verweise umgestellt
- konkurrierende Demo-/Versionspfade entfernt; `index.html` ist die einzige verbindliche Haupt-App
- Player mit vertikaler Sechs-Saiten-Spur, vier Modi, Timing-Wertung, A/B-Loop und adaptivem Tempo erhalten
- Mikrofonlogik korrigiert: Lernmodus bleibt beim Warten aktiv und Auto-Aufnahme beginnt erst nach dem tatsächlichen Player-Start
- Speicherfreigabe für erzeugte Aufnahme-URLs ergänzt
- tägliche Serie auf einen Eintrag pro lokalem Kalendertag korrigiert
- App-, Manifest-, Cache- und Diagnoseversion auf 5.1.0 vereinheitlicht
- Offline-Cache erweitert und auf eigene Cache-Namen begrenzt
- Spotify-Seite von automatischen externen Medien befreit; externe Links werden nur bewusst geöffnet
- externe URLs beim Import auf HTTP/HTTPS beschränkt
- Barrierefreiheit durch Sprunglink und eindeutige Beschriftungen verbessert
- PWA-Icons und iPad-Startbilder in das direkt hochladbare Hauptverzeichnis übernommen
- Installations-, Test- und Geräte-Abnahmedokumentation ergänzt

## Ausgangsstände

Die Hauptversion entstand aus dem funktionsstärksten vorhandenen Interactive-Play-Stand 3.0.1, den Korrekturen aus 3.0.2 sowie dem Spotify-Practice-Modul und den PWA-Assets aus Version 5. Die älteren Pakete bleiben historische Ausgangsstände und werden für den Betrieb nicht benötigt.

