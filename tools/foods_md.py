#!/usr/bin/env python3
"""Turn the diary's saved foods into an editable Markdown file and back.

The foods live in the artifact's database at library/foods, which only Claude
can reach. So this handles the two ends and Claude carries the middle:

    to-md   foods.json  FOODS.md      after reading the doc out of the store
    to-json FOODS.md    foods.json    to write the edited list back in

Round trips are lossless apart from note lines that repeat verbatim, which
to-md drops, and fields the file does not show, which to-json carries over
from the JSON it is given.
"""
import io, json, re, sys

MACROS = ['calories', 'protein', 'carbs', 'fat']
NUMBERS = re.compile(
    r'^\s*([\d.]+)\s*kcal\s*\|\s*([\d.]+)\s*protein\s*\|\s*([\d.]+)\s*carbs\s*\|\s*([\d.]+)\s*fat\s*$',
    re.I)

def n(v):
    f = float(v)
    return int(f) if f == int(f) else f

def distinct(note):
    """Re-estimates used to stack assumption lines. Keep the first of each."""
    seen, out = set(), []
    for line in (note or '').split('\n'):
        t = line.strip()
        if t and t.lower() not in seen:
            seen.add(t.lower())
            out.append(t)
    return out

def to_md(foods, when, version):
    L = ['# Saved foods', '',
         'The recurring foods the diary fills in when you type a matching name. Read out',
         'of the diary on %s (store version %s). %d of them.' % (when, version, len(foods)), '',
         'Edit this file and tell me to put it back. The shape matters:', '',
         '- One food per `##` heading. The heading IS the name the diary matches on, so',
         '  renaming a heading renames the food.',
         '- The numbers line stays in that exact order: kcal, protein, carbs, fat. Grams.',
         '  These are per serving.',
         '- Everything after it, up to the next heading, is the note.',
         '- Delete a whole block to drop that food. Add a block to add one.', '',
         "Order below is the diary's own, oldest saved first.", '']
    stacked = []
    for f in foods:
        lines = distinct(f.get('notes'))
        if len(lines) > 1:
            stacked.append((f['name'], len(lines)))
        L += ['## ' + f['name'], '',
              '%s kcal | %s protein | %s carbs | %s fat' % tuple(n(f.get(k, 0)) for k in MACROS)]
        if lines:
            L += [''] + lines
        L.append('')
    if stacked:
        L += ['---', '', '## Note, for me', '',
              'These carry more than one assumption line, stacked up by the bug fixed on',
              '2026-09-11: each re-estimate appended instead of replacing. Exact repeats were',
              'dropped, but near-repeats are still there. Worth keeping one line each.', '']
        L += ['- %s (%d lines)' % s for s in stacked]
        L.append('')
    return '\n'.join(L)

def to_json(text, before):
    """before: the foods list this file came from, for fields the file omits."""
    was = {(f.get('name') or '').lower(): f for f in before}
    out, cur = [], None
    for line in text.split('\n'):
        if line.startswith('## '):
            title = line[3:].strip()
            if title == 'Note, for me':      # the trailing section is not a food
                cur = None
                break
            cur = {'name': title, 'notes': []}
            out.append(cur)
            continue
        if cur is None or line.strip() == '---':   # a rule is never a note
            continue
        hit = NUMBERS.match(line)
        if hit and not cur.get('done'):
            for k, v in zip(MACROS, hit.groups()):
                cur[k] = n(v)
            cur['done'] = True
        elif line.strip():
            cur['notes'].append(line.strip())

    foods = []
    for f in out:
        if not f.pop('done', False):
            raise SystemExit('no numbers line under heading: ' + f['name'])
        food = dict(was.get(f['name'].lower(), {}))
        food.update({k: f[k] for k in MACROS})
        food['name'] = f['name']
        food['notes'] = '\n'.join(f['notes'])
        foods.append(food)
    return foods

if __name__ == '__main__':
    mode, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    if mode == 'to-md':
        doc = json.load(io.open(src, encoding='utf-8'))
        body = doc.get('data', doc)
        io.open(dst, 'w', encoding='utf-8').write(
            to_md(body['foods'], sys.argv[4], doc.get('version', '?')))
    elif mode == 'to-json':
        before = json.load(io.open(sys.argv[4], encoding='utf-8')) if len(sys.argv) > 4 else {'foods': []}
        foods = to_json(io.open(src, encoding='utf-8').read(), before.get('data', before)['foods'])
        io.open(dst, 'w', encoding='utf-8').write(json.dumps({'foods': foods}, ensure_ascii=False, indent=1))
        print(len(foods), 'foods')
    else:
        raise SystemExit('mode is to-md or to-json')
