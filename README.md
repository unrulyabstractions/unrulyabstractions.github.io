# Unruly Abstractions

Personal website for AI safety, interpretability, and alignment research. Optimized for Google Scholar indexing and academic visibility.

---

## 🤖 FOR CLAUDE/AI ASSISTANTS - READ THIS FIRST!

**CRITICAL INSTRUCTIONS FOR EVERY SESSION:**

1. **AT START OF SESSION:** Read ALL README files:
   - `/README.md` (this file)
   - `/scripts/README.md`
   - `/claude.md` (AI assistant specific instructions)

2. **BEFORE ANY COMMIT:**
   - ALWAYS run: `npm run deploy` or `node scripts/deploy.js`
   - Read `/scripts/README.md` for deployment workflow
   - This validates, builds, and stages GENERATED files only
   - ⚠️ **CRITICAL:** Check `git status` for OTHER modified files (PDFs, images, etc.)
   - Add ALL relevant modified files before committing

3. **NEVER commit without:**
   - Running deployment script first
   - Checking for ALL modified files
   - Adding ALL relevant changes

**Complete Deployment Workflow:**
```bash
npm run deploy                    # Generates pages, updates sitemap, validates
git status                        # Check for OTHER modified files
git add pdfs/*.pdf config/*.json  # Add any other modified files
git commit -m "..."               # Commit ALL changes
git push                          # Push to GitHub
```

---

## 🚀 Quick Deploy

**IMPORTANT: Always build before committing!**

```bash
# Full deployment (recommended)
npm run deploy

# Or manually:
node scripts/generate-paper-pages.js  # Generate landing pages
node scripts/update-sitemap.js         # Update sitemap
node scripts/validate-scholar.js       # Validate compliance
git add .
git commit -m "Your message"
git push
```

## 📋 Prerequisites

- Node.js (for build scripts)
- Git
- GitHub Pages hosting

## 🏗️ Project Structure

```
.
├── config/
│   ├── content.json          # Single source of truth for papers/notes
│   └── geometry.json         # Homepage layout configuration
├── papers/                   # Generated paper landing pages (DO NOT EDIT)
│   ├── wanderings.html
│   └── xenoreprod.html
├── pdfs/                     # Paper PDFs
├── scripts/
│   ├── generate-paper-pages.js  # Generate landing pages
│   ├── update-sitemap.js        # Generate sitemap
│   ├── validate-scholar.js      # Validate Google Scholar compliance
│   └── README.md                # Scripts documentation
├── index.html                # Homepage
├── papers.html               # Papers list page
├── notes.html               # Research notes page
├── robots.txt               # Search engine directives
└── sitemap.xml              # Auto-generated sitemap (DO NOT EDIT)
```

## 📝 Adding a New Paper

### Step 1: Add metadata to `config/content.json`

```json
{
  "filename": "my-paper",
  "displayName": "My Paper Title",
  "category": "theoretical",
  "date": "2025-11-28",
  "keywords": "AI Safety, My Topic, Keywords",
  "description": "Brief description of the paper for abstracts",
  "slides": "https://slides.example.com" // optional
}
```

### Step 2: Add PDF

Place your PDF at `pdfs/my-paper.pdf`

**IMPORTANT:** PDFs must be under 5MB for Google Scholar indexing.

To compress:
```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=pdfs/my-paper.pdf pdfs/my-paper-original.pdf
```

### Step 3: Deploy

```bash
npm run deploy
```

This will:
1. ✅ Generate `papers/my-paper.html` with Google Scholar metadata
2. ✅ Update `sitemap.xml` with new paper URLs
3. ✅ Validate all Google Scholar requirements
4. ✅ Show you what needs to be committed
5. ⏸️ Wait for you to review before committing

### Step 4: Commit and Push

```bash
git commit -m "Add new paper: My Paper Title"
git push
```

## 🔍 Google Scholar Indexing

### Requirements Met

✅ All required meta tags (`citation_title`, `citation_author`, `citation_publication_date`)
✅ All recommended tags (PDF URL, keywords, institution, etc.)
✅ Dublin Core fallback tags
✅ Schema.org structured data
✅ robots.txt allows Googlebot-Scholar
✅ Sitemap.xml with proper priorities

### Validation

Run validation anytime:
```bash
node scripts/validate-scholar.js
```

### Submission Checklist

After deploying new papers:

1. **Submit sitemap** in Google Search Console
   - Go to: https://search.google.com/search-console
   - Sitemaps → Add: `sitemap.xml`

2. **Request indexing** for new pages
   - URL Inspection tool
   - Enter: `https://www.unrulyabstractions.com/papers/my-paper.html`
   - Click: "Request Indexing"

3. **Wait 1-2 weeks** for Google Scholar to index

## 🛠️ Available Scripts

See [scripts/README.md](scripts/README.md) for detailed documentation.

```bash
# Generate paper landing pages from content.json
node scripts/generate-paper-pages.js

# Update sitemap.xml from content.json
node scripts/update-sitemap.js

# Validate Google Scholar compliance
node scripts/validate-scholar.js

# Deploy everything (all of the above)
npm run deploy
```

## ⚠️ Important Notes

### DO NOT Edit Manually
- `papers/*.html` - Auto-generated from content.json
- `sitemap.xml` - Auto-generated from content.json

Always edit `config/content.json` and run the scripts.

### Git Pre-Commit Hook

A pre-commit hook reminds you to build before committing. If you see warnings, run:
```bash
npm run deploy
```

### PDF Size Limit

Google Scholar has a **5MB limit** for PDFs. Compress PDFs before adding:
- Use Ghostscript (recommended)
- Online tools: [iLovePDF](https://www.ilovepdf.com/compress_pdf), [SmallPDF](https://smallpdf.com/compress-pdf)

## 📚 Resources

- [Google Scholar Inclusion Guidelines](https://scholar.google.com/intl/en/scholar/inclusion.html)
- [Google Search Console](https://search.google.com/search-console)
- [Scripts Documentation](scripts/README.md)

## 🤝 Workflow for Assistants (MCP/Claude Code)

When user says "commit", "deploy", "push", or similar:

**⚠️ CRITICAL: The deployment script only stages generated files (HTML, XML). You MUST check for and commit ALL modified files including PDFs!**

```bash
# Step 1: Run deployment script
npm run deploy

# Step 2: Check for ANY other modified files
git status

# Step 3: Add ALL relevant modified files (PDFs, config, etc.)
# Exclude only .DS_Store and tmp/ files
git add pdfs/*.pdf config/*.json img/* css/* js/*

# Step 4: Commit ALL changes together
git commit -m "Descriptive message"

# Step 5: Push to GitHub
git push
```

**Complete Workflow Checklist:**
1. ✅ Run `npm run deploy` (stages generated files)
2. ✅ Run `git status` to see ALL modified files
3. ✅ Add any other modified files (PDFs, images, CSS, JS, etc.)
4. ✅ Commit everything together with descriptive message
5. ✅ Push to GitHub

**Never commit without:**
- Running `npm run deploy` first
- Checking `git status` for other changes
- Adding ALL relevant modified files

## 📄 License

Papers and content © Unruly Abstractions. Website code available for reference.

---

🤖 This site uses automated tooling for Google Scholar indexing. See [scripts/README.md](scripts/README.md) for details.
