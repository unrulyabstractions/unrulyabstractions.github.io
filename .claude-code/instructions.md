# Claude Code Instructions for Unruly Abstractions Website

## Critical Workflow Rules

### When User Says "Commit", "Deploy", "Update", "Build", or "Push"

**ALWAYS run the full deployment script first:**

```bash
npm run deploy
```

This command:
1. ✅ Generates paper landing pages from `config/content.json`
2. ✅ Updates `sitemap.xml` with all paper URLs
3. ✅ Validates Google Scholar compliance
4. ✅ Stages generated files for commit
5. ✅ Shows git status

**NEVER commit without running `npm run deploy` first!**

### Deployment Workflow

```bash
# Step 1: ALWAYS run deploy first
npm run deploy

# Step 2: Review output and git status

# Step 3: Commit with descriptive message
git commit -m "Add new paper: [Paper Title]"
# OR
git commit -m "Update [what changed]"

# Step 4: Push to main
git push
```

## File Modification Rules

### DO NOT Edit Manually
- `papers/*.html` - Auto-generated from content.json
- `sitemap.xml` - Auto-generated from content.json

### Always Edit
- `config/content.json` - Single source of truth for papers/notes
- Then run `npm run deploy`

## Adding a New Paper

When user wants to add a paper:

```bash
# 1. User provides paper details
# 2. Add entry to config/content.json:
{
  "filename": "paper-slug",
  "displayName": "Full Paper Title",
  "category": "theoretical",  // or "technical autotheory", "empirical"
  "date": "2025-11-28",
  "keywords": "AI Safety, Topic1, Topic2",
  "description": "Brief description for abstract",
  "slides": "https://slides.url" // optional
}

# 3. Ensure PDF exists at pdfs/paper-slug.pdf

# 4. Run deployment
npm run deploy

# 5. Commit and push
git commit -m "Add new paper: Full Paper Title"
git push
```

## Available Commands

```bash
# Full deployment (use this for commit/deploy/update requests)
npm run deploy

# Individual steps (rarely needed):
npm run generate  # Generate paper pages only
npm run sitemap   # Update sitemap only
npm run validate  # Validate only
```

## Pre-Commit Hook

A git pre-commit hook is installed that:
- ✅ Checks if content.json changed but generated files weren't rebuilt
- ❌ **Blocks commit** if rebuild is needed
- ℹ️  Shows instructions to run `npm run deploy`

If the hook blocks a commit, the user MUST run `npm run deploy` first.

## Google Scholar Requirements

Papers must meet these requirements:
- PDF < 5MB (compress if needed with Ghostscript)
- All metadata in content.json (keywords, description, etc.)
- Generated pages have proper citation_* tags

Run `npm run validate` to check compliance.

## Common User Requests

### "Add a new paper"
1. Ask for: title, category, date, keywords, description, slides URL (optional)
2. Check if PDF exists in pdfs/
3. Add entry to config/content.json
4. Run `npm run deploy`
5. Commit and push

### "Update a paper"
1. Edit entry in config/content.json
2. Run `npm run deploy`
3. Commit and push

### "Commit changes" or "Deploy"
1. **ALWAYS** run `npm run deploy` first
2. Review git status
3. Commit with descriptive message
4. Push

### "Fix Google Scholar indexing"
1. Run `npm run validate` to see issues
2. Fix issues (usually PDF size or missing metadata)
3. Run `npm run deploy`
4. Commit and push

## Error Handling

### Pre-commit hook blocks commit
```bash
# User sees: "Commit aborted. Run 'npm run deploy' first."
# Solution:
npm run deploy
git commit -m "Your message"
```

### Validation warnings
```bash
# User sees: PDF too large, missing metadata, etc.
# Check validation output
npm run validate

# Fix issues, then:
npm run deploy
git commit -m "Fix validation issues"
```

### PDF too large (>5MB)
```bash
# Compress PDF
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=pdfs/compressed.pdf pdfs/original.pdf

# Replace original
mv pdfs/compressed.pdf pdfs/original.pdf

# Rebuild
npm run deploy
```

## Important Reminders

1. **ALWAYS** run `npm run deploy` before committing
2. **NEVER** edit `papers/*.html` or `sitemap.xml` manually
3. **CHECK** validation output for Google Scholar compliance
4. **ENSURE** PDFs are under 5MB
5. **USE** descriptive commit messages

## Summary

When in doubt, remember the golden rule:

**`npm run deploy` → Review → Commit → Push**

This ensures all generated files are up-to-date and Google Scholar metadata is properly configured.
