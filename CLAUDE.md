# Instructions for Claude Code / AI Assistants

## 🚨 READ THIS FIRST - EVERY SESSION

When the user says **"commit"**, **"deploy"**, **"push"**, or any similar command, you MUST follow this COMPLETE workflow:

---

## ✅ COMPLETE DEPLOYMENT CHECKLIST

### Step 1: Run Deployment Script
```bash
npm run deploy
```
- This generates paper landing pages
- Updates sitemap.xml
- Validates Google Scholar compliance
- **ONLY stages generated files** (papers/*.html, sitemap.xml)

### Step 2: Check for ALL Modified Files
```bash
git status
```
**⚠️ CRITICAL:** The deployment script does NOT stage:
- PDFs in `pdfs/` directory
- Changes to images in `img/` directory
- Changes to CSS/JS files
- Any other manual edits

### Step 3: Add ALL Relevant Modified Files
```bash
# Look at git status output and add ALL relevant files
# Common patterns:
git add pdfs/*.pdf          # If PDFs were modified
git add config/*.json       # If config was modified
git add img/*              # If images were modified
git add css/*              # If styles were modified
git add js/*               # If scripts were modified
git add index.html         # If homepage was modified
```

**DO NOT add:**
- `.DS_Store` files
- `tmp/` directory
- `node_modules/`

### Step 4: Commit ALL Changes Together
```bash
git commit -m "Descriptive message explaining ALL changes"
```

### Step 5: Push to GitHub
```bash
git push
```

---

## 🔴 COMMON MISTAKE - WHAT WENT WRONG BEFORE

**WRONG:** Only committing what `npm run deploy` staged
```bash
npm run deploy
git commit -m "Update"
git push
# ❌ PDF changes NOT included!
```

**CORRECT:** Check status and add ALL modified files
```bash
npm run deploy
git status                # SEE all modified files
git add pdfs/*.pdf        # ADD the PDF that was modified
git commit -m "Update"
git push
# ✅ Everything included!
```

---

## 📋 VERIFICATION

After pushing, verify you committed everything:
```bash
git status
# Should show: "nothing to commit, working tree clean"
# If you still see modified files, you missed something!
```

---

## 🎯 EXAMPLES

### Example 1: User updated a PDF and its metadata
```bash
npm run deploy                    # Stages generated files
git status                        # Shows pdfs/paper.pdf modified
git add pdfs/paper.pdf           # Add the PDF
git commit -m "Update paper PDF and metadata"
git push
```

### Example 2: User added new images
```bash
npm run deploy                    # Stages generated files
git status                        # Shows img/new-image.png untracked
git add img/*                     # Add all images
git commit -m "Add new images"
git push
```

### Example 3: User edited config and styles
```bash
npm run deploy                    # Stages generated files
git status                        # Shows config/*.json and css/*.css modified
git add config/*.json css/*.css  # Add both
git commit -m "Update config and styles"
git push
```

---

## 🤖 AUTOMATION TIPS

1. **Always run these commands in sequence:**
   - `npm run deploy` - generates files
   - `git status` - check for other changes
   - `git add <files>` - add other modified files
   - `git commit` - commit everything
   - `git push` - push to remote

2. **Look at the git status output carefully** - it tells you exactly what files were modified but not staged

3. **When in doubt, ask the user** - "I see these files were modified: X, Y, Z. Should I commit all of them?"

---

## 📚 REQUIRED READING

Before any session, read:
1. `/README.md` - Main documentation
2. `/scripts/README.md` - Scripts documentation
3. `/claude.md` - This file

---

## ⚠️ FINAL WARNING

**NEVER EVER commit without:**
1. ✅ Running `npm run deploy`
2. ✅ Checking `git status` for ALL modified files
3. ✅ Adding ALL relevant modified files
4. ✅ Verifying `git status` shows clean working tree after push

If you skip step 2-3, the website will NOT be fully updated!
