# Daybook

A private food and WHOOP diary. `daybook.html` is the whole app, one file, published as a
Claude artifact at https://claude.ai/code/artifact/32d34390-718c-4251-a503-df833f0e2c2d

It declares two runtime capabilities:

- `db` — a shared document store, and the live copy of the diary. `days/<YYYY-MM-DD>` holds
  one day (`label`, `metrics`, `entries`), `library/foods` holds the remembered foods. Every
  device reads and writes the same store, live, so the phone and the laptop never drift.
- `sample` — lets the page ask Claude to estimate macros from a plain-English description of
  a meal, returning the numbers along with the portion assumptions it made, so they can be
  corrected before saving.

With neither available the page falls back to that browser's local storage and says so in the
header pill.

Entries carry the day's WHOOP numbers: recovery, sleep hours and resting heart rate on a wake
entry, day strain on an exercise entry. Imported nutrition is an editable estimate, marked
with a tilde. Missing WHOOP values are left blank rather than invented.

An earlier version of this diary ran on GitHub Pages and kept everything in browser local
storage. It was removed once the database version replaced it; it is still in this
repository's history.
