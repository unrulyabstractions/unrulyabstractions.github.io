# Scripts

Automation scripts for managing the Unruly Abstractions website.

## Table of Contents
- [generate-paper-pages.js](#generate-paper-pagesjs) - Generate paper landing pages
- [update-sitemap.js](#update-sitemapjs) - Update sitemap.xml automatically
- [validate-scholar.js](#validate-scholarjs) - Validate Google Scholar compliance

## Quick Start

After adding a new paper:
```bash
# 1. Generate landing pages
node scripts/generate-paper-pages.js

# 2. Update sitemap
node scripts/update-sitemap.js

# 3. Validate everything
node scripts/validate-scholar.js

# 4. Commit and push
git add . && git commit -m "Add new paper" && git push
```

---

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

---

## update-sitemap.js

Automatically updates `sitemap.xml` with all papers from `config/content.json`.

### Usage

```bash
node scripts/update-sitemap.js
```

### What it does

- Reads papers from `config/content.json`
- Generates sitemap.xml with all paper URLs (HTML landing pages + PDFs)
- Sets proper priorities (0.9 for landing pages, 0.7 for PDFs)
- Uses publication dates as lastmod values
- Includes homepage, papers.html, and notes.html

### When to run

Run this script:
- After adding new papers
- After updating paper dates in content.json
- Before requesting Google Search Console re-indexing

### Output

The sitemap includes:
- Homepage (priority: 1.0)
- Papers page (priority: 0.9)
- Research notes page (priority: 0.9)
- Paper landing pages (priority: 0.9, high for Google Scholar)
- Paper PDFs (priority: 0.7)

---

## validate-scholar.js

Validates that all papers meet Google Scholar indexing requirements.

### Usage

```bash
node scripts/validate-scholar.js
```

### What it checks

**Required metadata (must pass):**
- `citation_title` - Paper title
- `citation_author` - Author name(s)
- `citation_publication_date` - Publication date

**Recommended metadata:**
- `citation_pdf_url` - Link to PDF
- `citation_abstract_html_url` - Link to abstract page
- `citation_online_date` - Online publication date
- `citation_language` - Document language
- `citation_keywords` - Subject keywords
- `citation_technical_report_institution` - Institution name

**Technical requirements:**
- PDF files exist and are accessible
- PDF files are under 5MB (Google Scholar limit)
- robots.txt allows Googlebot-Scholar

### Output

The script provides color-coded output:
- ✅ Green: Requirement met
- ⚠️ Yellow: Warning (non-critical, but should be addressed)
- ❌ Red: Critical issue (blocks Google Scholar indexing)

### Fixing issues

**PDF too large (>5MB):**
```bash
# Compress PDF using Ghostscript (recommended)
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=pdfs/compressed.pdf pdfs/original.pdf

# Or use online tools:
# - https://www.ilovepdf.com/compress_pdf
# - https://smallpdf.com/compress-pdf
```

**Missing metadata:**
Run `node scripts/generate-paper-pages.js` to regenerate pages with latest metadata.

### When to run

Run this script:
- Before submitting to Google Search Console
- After adding new papers
- After updating content.json
- Before requesting Google Scholar indexing
