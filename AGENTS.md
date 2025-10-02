# Repository Guidelines

## Project Structure & Module Organization
The homepage (`index.html`) is a self-contained HTML file that loads `config/geometry.json` for design tokens and column layout, then `config/content.json` for data. Detail pages (`papers.html`, `notes.html`) render the same datasets with static styling. PDFs live in `pdfs/`, and BrowserSync wiring sits in `refresh-local.sh`.

## Build, Test, and Development Commands
- `npm install -g browser-sync`: installs the lone tooling dependency.
- `./refresh-local.sh`: serves `http://localhost:3000`, watches HTML/JSON/CSS/PDF files, and reloads with cache-busting.
- `browser-sync start --server --files "**/*.html" "config/*.json" "**/*.css" "pdfs/*.pdf" --no-notify`: raw command if you need to tweak flags.

## Coding Style & Naming Conventions
CSS custom properties follow the `--ua-*` prefix and are derived from `geometry.json`; add new tokens there and map them in `TOKEN_MAP` inside `index.html`. JavaScript sticks to `const`/`let`, small helpers, and explicit return types. Keep JSON strictly double-quoted with three-space indents and include `_comment` keys when extra context helps future edits.

## Testing Guidelines
Run `./refresh-local.sh`, then:
- Verify column order/widths update when adjusting `columns[].weight`.
- Toggle geometry tokens (padding, typography) and confirm the CSS adapts without editing markup.
- Click through every paper/note link to ensure PDFs and external URLs resolve.
- Resize the viewport to confirm text scaling avoids multi-line wraps.

## Commit & Pull Request Guidelines
Use imperative, 65-character-or-fewer subjects (e.g., `Refine geometry token mapping`). Stage only intentional files (`git status` before commit). PRs should outline configuration/tuning changes, list manual test steps (`./refresh-local.sh` + browser checks), and attach screenshots if the visual balance shifts.

## Geometry & Content Quick Reference
- Add a column by defining it in `geometry.json` (`id`, `dataset`, `weight`, `entry` config) and providing matching data in `content.json`.
- `designTokens.layout.auxColumnFr` controls the third grid column that houses the spacer link column; set >1 to leave more breathing room.
- `designTokens.motion.columnDelayStepSec` staggers column entrance animations; keep it subtle (0.1–0.3s).
- `effects.smudge*` tune the external link buttons; randomization in JS will build on these defaults.
