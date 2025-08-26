# Claude Code Instructions

## Repository Permissions

Claude has FULL access to this repository folder and can:
- Read, edit, create, and delete any files
- Run any bash commands including git operations
- Execute deployment scripts
- Modify the static HTML/CSS/JS files
- Update PDFs in the pdfs/ folder
- Perform file operations (move, copy, rename)

## 🚀 DEPLOYMENT PROCESS

**SIMPLE STATIC SITE (Aug 26, 2025) - Unruly Abstractions**

When the user says "deploy", run the following command:

```bash
./deploy.sh
```

**What this does:**
1. Commits all changes to the `master` branch
2. Pushes to GitHub
3. GitHub Pages automatically serves the static files

**GitHub Pages Configuration:**
- Repository: `unrulyabstractions/unrulyabstractions.github.io`
- Source: Deploy from `master` branch
- Site URL: `https://unrulyabstractions.github.io`
- Files: Static HTML (`index.html`), CSS (inline), JavaScript (inline)

**After deployment, ALWAYS verify:**
1. Main site works: https://unrulyabstractions.github.io/
2. PDF files in pdfs/ folder are accessible at: https://unrulyabstractions.github.io/pdfs/filename.pdf
3. Example: https://unrulyabstractions.github.io/pdfs/wanderings.pdf

## Site Structure

- **`index.html`**: Main page with embedded CSS and JavaScript
- **`pdfs/`**: Folder containing PDF papers
- **`deploy.sh`**: Simple deployment script
- **`test-deployment.sh`**: Deployment verification script

## Site Features

- **Pure HTML/CSS/JS**: No build process, no dependencies
- **Dynamic PDF Detection**: Automatically discovers PDFs in `pdfs/` folder
- **Clean Design**: Minimalist interface with smooth animations
- **Responsive Layout**: Works on desktop and mobile devices
- **Fast Loading**: No external dependencies except Google Fonts

## Development Commands

- `./deploy.sh` - Deploy to GitHub Pages
- `./test-deployment.sh` - Test deployment (creates test file, deploys, verifies)

## Adding New Papers

1. Add PDF file to `pdfs/` folder
2. The site will automatically detect it if the filename matches common paper names:
   - wanderings, abstractions, thoughts, musings, reflections, essays, notes, writings
3. Run `./deploy.sh` to publish

## Important Notes

- **No Build Process**: This is a simple static site - just HTML, CSS, and JavaScript
- **No Dependencies**: No npm, Node.js, or build tools required
- **GitHub Pages**: Serves directly from the master branch
- **Instant Updates**: Changes are live as soon as GitHub Pages updates (usually 1-2 minutes)

Claude has full permissions to modify any aspect of this static website.