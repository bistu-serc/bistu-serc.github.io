# SERC Visual Style Guide

## Design Direction
- Tone: academic, neutral, engineering-focused
- Palette: grayscale only (`--ink-*`, `--surface-*`)
- Typography: local serif stack (`Noto Serif SC Local`) for Chinese and English
- External dependencies: disallowed for fonts, CSS, JS

## CSS Layering
Load order from `index.html`:
1. `css/theme/tokens.css`
2. `css/theme/vendor-bridge.css`
3. `css/theme/base.css`
4. `css/theme/layout.css`
5. `css/theme/components.css`
6. `css/theme/pages.css`
7. `css/theme/utilities.css`

Rules:
- Tokens define primitives only.
- Base defines typography and global defaults.
- Layout defines container widths and macro spacing.
- Components define reusable blocks only.
- Pages define route-specific exceptions only.

## Responsive Matrix
- XS mobile: `360` and `390`
- Tablet portrait: `768`
- Tablet landscape / small laptop: `1024`
- Desktop: `1280+`

Global acceptance:
- No page-level horizontal overflow.
- Header and nav remain fully interactive.
- Section titles remain in visual grid and do not overlap content.
- Tables may scroll inside dedicated containers only.

## Container System
- Max width: `--container-max`
- Side padding: token-driven (`--container-pad-*`)
- Avoid inline-style selectors for long-term rules.
- Prefer semantic classes added by runtime enhancement layer.

## Typography
- Route titles, section titles, and card titles must use display font token.
- Body, table cells, and metadata use body font token.
- English pages must avoid mixed-language UI labels.

## Motion
- Respect reduced-motion preference.
- Reveal and parallax effects are optional enhancements and must degrade safely.
