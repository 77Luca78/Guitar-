#!/usr/bin/env python3
"""Apply the Luca Guitar Quest 3.0.2 repairs safely.

Run once in the repository root:
    python3 apply-3.0.2-fix.py

The script stops if an expected source block cannot be found, so it does not
silently damage a newer or different version of the app.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def read(name: str) -> str:
    path = ROOT / name
    if not path.exists():
        raise FileNotFoundError(f"Fehlende Datei: {name}")
    return path.read_text(encoding="utf-8")


def write(name: str, text: str) -> None:
    (ROOT / name).write_text(text, encoding="utf-8")


def replace_exact(text: str, old: str, new: str, *, label: str, expected: int = 1) -> str:
    found = text.count(old)
    if found != expected:
        raise RuntimeError(f"{label}: erwartet {expected} Fundstelle(n), gefunden {found}.")
    return text.replace(old, new)


def patch_mic_pro() -> None:
    name = "mic-pro.js"
    text = read(name)

    if "const VERSION = '2.0.1';" not in text:
        text = replace_exact(
            text,
            "const VERSION = '2.0.0';",
            "const VERSION = '2.0.1';",
            label="Mikrofon-Pro-Version",
        )

    active = "(state.player.playing||state.player.waitingForEvent)"
    for mode in ("melody", "chords", "rhythm"):
        old = f"state.player.mic&&state.player.playing&&state.player.mode==='{mode}'"
        new = f"state.player.mic&&{active}&&state.player.mode==='{mode}'"
        if new not in text:
            text = replace_exact(text, old, new, label=f"Lernmodus-Mikrofon {mode}")

    if "function wrapPlayerRunning(){" not in text:
        pattern = re.compile(
            r"  function wrapPlayerToggle\(\)\{.*?\n  \}\n\n  function wrapFinishAttempt\(\)\{",
            re.DOTALL,
        )
        replacement = """  function wrapPlayerRunning(){
    if(typeof setPlayerRunning!=='function'||setPlayerRunning.__micProWrapped)return;
    const original=setPlayerRunning;
    const wrapped=function(running){
      const wasPlaying=!!state.player.playing;
      const result=original.apply(this,arguments);
      const nowPlaying=!!state.player.playing;
      if(settings.autoRecord&&!wasPlaying&&nowPlaying){
        if(mediaRecorder?.state==='paused')resumeRecording();else startRecording();
      }
      if(settings.autoRecord&&wasPlaying&&!nowPlaying&&mediaRecorder?.state==='recording')pauseRecording();
      return result;
    };
    wrapped.__micProWrapped=true;
    setPlayerRunning=wrapped;
  }

  function wrapFinishAttempt(){"""
        text, count = pattern.subn(replacement, text, count=1)
        if count != 1:
            raise RuntimeError("Auto-Aufnahme: alter Player-Wrapper wurde nicht eindeutig gefunden.")

    old_init = "injectUI();wrapPlayerToggle();wrapFinishAttempt();observeUi();"
    new_init = "injectUI();wrapPlayerRunning();wrapFinishAttempt();observeUi();"
    if new_init not in text:
        text = replace_exact(text, old_init, new_init, label="Initialisierung Auto-Aufnahme")

    write(name, text)


def patch_daily_streak() -> None:
    name = "app.js"
    text = read(name)
    old = (
        "state.progress.xp=(state.progress.xp||0)+xp;"
        "state.progress.streak=(state.progress.streak||0)+1;"
        "state.progress.lastPlayed="
    )
    new = (
        "state.progress.xp=(state.progress.xp||0)+xp;"
        "const practiceDate=new Date(),dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,today=dayKey(practiceDate),yesterdayDate=new Date(practiceDate);"
        "yesterdayDate.setDate(practiceDate.getDate()-1);const yesterday=dayKey(yesterdayDate);"
        "if(state.progress.lastPracticeDate!==today){state.progress.streak=state.progress.lastPracticeDate===yesterday?(state.progress.streak||0)+1:1;state.progress.lastPracticeDate=today}"
        "state.progress.lastPlayed="
    )
    if "lastPracticeDate!==today" not in text:
        text = replace_exact(text, old, new, label="Tägliche Übungsserie")
    write(name, text)


def patch_versions() -> None:
    index_name = "index.html"
    index = read(index_name)
    index = re.sub(r"Interactive Play 3\.0(?!\.\d)", "Interactive Play 3.0.2", index)
    write(index_name, index)

    worker_name = "service-worker.js"
    worker = read(worker_name)
    if "3-0-2" not in worker:
        worker = replace_exact(worker, "3-0-1", "3-0-2", label="Service-Worker-Cache")
    write(worker_name, worker)

    readme_name = "README.md"
    readme = read(readme_name)
    readme = readme.replace(
        "# Luca Guitar Quest · Interactive Play 3.0.1",
        "# Luca Guitar Quest · Interactive Play 3.0.2",
        1,
    )
    if "## Fixes in 3.0.2" not in readme:
        marker = "## Fixes in 3.0.1"
        block = (
            "## Fixes in 3.0.2\n\n"
            "- Mikrofon-Pro erkennt im Lernmodus den richtigen Ton auch während die Spur wartet\n"
            "- automatische Aufnahme startet erst beim tatsächlichen Player-Start nach dem Countdown\n"
            "- Übungsserie zählt Übungstage statt einzelne Durchläufe\n"
            "- sichtbare Versionsangaben und Offline-Cache auf 3.0.2 aktualisiert\n\n"
        )
        if marker not in readme:
            raise RuntimeError("README: Abschnitt für Version 3.0.1 nicht gefunden.")
        readme = readme.replace(marker, block + marker, 1)
    write(readme_name, readme)


def main() -> None:
    patch_mic_pro()
    patch_daily_streak()
    patch_versions()
    print("Luca Guitar Quest 3.0.2 wurde erfolgreich vorbereitet.")
    print("Als Nächstes ausführen:")
    print("  node --check app.js")
    print("  node --check mic-pro.js")
    print("Danach die Änderungen committen und die PWA einmal vollständig neu laden.")


if __name__ == "__main__":
    main()
