# Daybook, the Claude-hosted version

`daybook.html` is the whole app: one file, published as a private Claude artifact at
https://claude.ai/code/artifact/32d34390-718c-4251-a503-df833f0e2c2d

It declares two runtime capabilities:

- `db` — a shared document store. `days/<YYYY-MM-DD>` holds one day (`label`, `metrics`,
  `entries`), `library/foods` holds the remembered foods. Every device reads and writes the
  same store, live, so the phone and the laptop never drift.
- `sample` — lets the page ask Claude to estimate macros from a plain-English description,
  returning the numbers plus the portion assumptions it made.
With neither of them available the page falls back to this browser's local storage and says so
in the header pill.

The `day-*.json` and `foods.json` files are the six imported days as they were seeded into
the database. They are a record of the starting state, not something the page reads.

The files in the repository root are the older GitHub Pages version, which stores everything
in browser local storage and cannot estimate macros.
