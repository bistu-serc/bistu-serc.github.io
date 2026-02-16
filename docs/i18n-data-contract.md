# SERC i18n Data Contract

## Goal
Ensure English pages are fully readable with complete data-level localization, not only UI-label translation.

## Runtime Sources
- `js/i18n-data-map.js` exports `window.SERC_ZH_EN_MAP`.
- `js/runtime-compat.js` consumes this map when `lang=en`.

## Required Behaviors
- English mode must prioritize explicit data map translation for CJK strings.
- Static dictionary translation is only a fallback.
- Numbered placeholder news titles are not allowed in final UI.

## Data Files Covered
- `data/news.json`
- `data/tools.json`
- `data/papers.csv`
- `data/patents.csv`
- `data/copyrights.csv`
- `data/teachers.csv`
- `data/students.csv`

## Generation Workflow
- Run `node scripts/i18n/build-zh-en-map.mjs`.
- Output files:
  - `data/i18n/zh-en-map.json`
  - `js/i18n-data-map.js`

## Compatibility Notes
- CSV decoding must support GB18030.
- String matching is normalized by collapsed whitespace.
- Punctuation variants (`：/:` `，/,` `（/(` `）/)`) are normalized during lookup.

## QA Gates
- English routes should not show CJK text except language switcher label `中文`.
- Pagination, tool labels, and route titles must be localized.
