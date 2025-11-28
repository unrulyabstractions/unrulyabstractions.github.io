# Scripts

Automation scripts for managing the Unruly Abstractions website.

## generate-paper-pages.js

Automatically generates HTML landing pages for papers from `config/content.json`.

### Usage

```bash
node scripts/generate-paper-pages.js
```

### What it does

- Reads paper metadata from `config/content.json`
- Generates individual HTML pages in `papers/` directory
- Each page includes:
  - Google Scholar metadata tags (`citation_*`)
  - Dublin Core metadata
  - Schema.org structured data (ScholarlyArticle)
  - Open Graph and Twitter Card tags
  - Proper canonical URLs with www subdomain

### When to run

Run this script whenever you:
- Add a new paper to `config/content.json`
- Update paper metadata (title, date, category, etc.)
- Change the paper landing page template

### Adding a new paper

1. Add paper entry to `config/content.json`:
   ```json
   {
     "filename": "my-paper",
     "displayName": "My Paper Title",
     "category": "theoretical",
     "date": "2025-11-27",
     "slides": "https://example.com/slides" // optional
   }
   ```

2. Add the PDF to `pdfs/my-paper.pdf`

3. Run the generator:
   ```bash
   node scripts/generate-paper-pages.js
   ```

4. Commit and push:
   ```bash
   git add papers/ config/content.json pdfs/
   git commit -m "Add new paper: My Paper Title"
   git push
   ```

The paper will be automatically indexed by Google Scholar within 1-2 weeks.
