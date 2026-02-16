# Theme Layering

This folder contains the canonical visual system for the site.

Load order (from `index.html`):

1. `tokens.css` - design tokens + local font-face declarations
2. `vendor-bridge.css` - neutralize legacy colorful/gradient rules
3. `base.css` - global typography and baseline text/link styles
4. `layout.css` - page structure, container width, header/footer layout
5. `components.css` - reusable UI component rules
6. `pages.css` - route-specific styling
7. `utilities.css` - small utility interactions

`css/research-theme.css` is intentionally kept as a deprecated shim.
