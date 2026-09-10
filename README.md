# Daybook

Static personal diary with six imported days, September 4–9, 2026. Food autocomplete remembers meals and per-serving macros, and exercise, wake-up, work and note entries autocomplete from what you have already logged of that type; fractional servings update daily totals. All imported nutrition is explicitly an illustrative estimate with editable portion assumptions. Missing WHOOP values and CGM readings are not fabricated.

Run locally: `python3 -m http.server 8080 --directory public`. Tests: `npm test`.

Data added in the app is stored in localStorage for this browser/origin, not synchronized to a server or other devices. JSON export/restore provides portable backups. WHOOP and Stelo entries are manual; there are no device integrations or clinical interpretations. Imported diary data is part of the private site assets. No other workspace health documents are included.
