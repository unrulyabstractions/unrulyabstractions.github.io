# Unruly Abstractions

Personal research website for AI safety, interpretability, and alignment projects. The homepage is a single HTML document that hydrates itself with JSON configuration and design tokens so layout changes never require touching markup.

## Local Development

- Install the only runtime dependency once: `npm install -g browser-sync`
- Start the live server: `./refresh-local.sh`
  - Serves the site at `http://localhost:3000`
  - Watches `*.html`, `config/*.json`, `*.css`, and `pdfs/*.pdf`
  - Performs hard reloads so geometry/content changes apply immediately

## Repository Layout

```
.
├── index.html              # Homepage (dynamic columns + design token loader)
├── papers.html             # Full paper list (static styling)
├── notes.html              # Full research notes list (static styling)
├── config/
│   ├── content.json        # Data for papers and notes
│   └── geometry.json       # Column definitions + design tokens
├── pdfs/                   # Paper PDFs
├── refresh-local.sh        # BrowserSync helper
└── robots.txt / sitemap.xml
```

## Editing Content (`config/content.json`)

Supply data only—no layout metadata lives here. Each array is consumed by its matching column definition.

```json
{
  "papers": [
    { "filename": "wanderings", "displayName": "Category-Theoretic Wanderings into Interpretability", "category": "technical autotheory", "date": "2025-09-16" }
  ],
  "notes": [
    { "url": "https://…", "displayName": "Identifiability Toy Study", "category": "empirical", "date": "ongoing" }
  ]
}
```

- `date` accepts ISO strings or keywords like `ongoing` (these float to the top).
- Papers must have a matching `pdfs/<filename>.pdf` file.

## Editing Layout (`config/geometry.json`)

The homepage reads this file first, hydrates CSS custom properties, then renders columns in weight order. Only the `designTokens` section should require tweaks unless you are adding a new column.

- `columns`: choose which dataset to render, the display label, weight, and detail page target. Weights drive both column width and ordering.
- `designTokens.colors`: background and text palette; `sectionTitleBackgroundOpacity` controls the translucent chips.
- `designTokens.layout`: container padding, grid gap, max list width, and auxiliary column width (`auxColumnFr`).
- `designTokens.typography` / `spacing`: font sizes, weights, and padding for titles, category labels, entries, and external links.
- `designTokens.motion` / `hover`: animation durations and offsets.
- `designTokens.effects`: gradients, glow, and smudge defaults for the link buttons.

Add a column by inserting a new object into `columns` with a unique `id`, `dataset` pointing at a key in `content.json`, and an `entry` block describing how to derive URLs (pdf vs external link).

## Workflow Tips

1. Update `geometry.json`, save, and let BrowserSync reload. Reordering weights takes effect instantly.
2. Run `jq . config/content.json` after large edits to catch syntax errors.
3. Before commit, open the local site and verify PDF links resolve and typography scales cleanly on resize.
