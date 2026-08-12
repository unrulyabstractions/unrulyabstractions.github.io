#!/usr/bin/env node

/**
 * Generate the homepage (index.html), the chronological index (all.html),
 * and the topic pages from config/content.json + config/geometry.json.
 *
 * Design system ("spec sheet with pastels"): light cool-white ground,
 * near-black ink, periwinkle accent, tiny mono uppercase labels, hairline
 * rules, and a pastel band behind the masthead. Each research thread gets a
 * pastel accent (rose / periwinkle / peach). Entries lead with a real figure
 * from the work (content.json `image`); entries without one get a pastel
 * placeholder tile. The site presents as a collective: no personal name in
 * any visible text.
 *
 * Display face is Space Grotesk, body is Inter, labels are Roboto Mono.
 * Output is fully static: no client-side fetching, no cache busting.
 *
 * Usage: node scripts/generate-homepage.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONTENT_JSON_PATH = path.join(__dirname, '../config/content.json');
const GEOMETRY_JSON_PATH = path.join(__dirname, '../config/geometry.json');
const SITE_ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://www.unrulyabstractions.com';

const THREAD_TONES = ['rose', 'peri', 'peach'];

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseLocalDate(dateString) {
  const ym = /^(\d{4})-(\d{1,2})$/.exec(dateString.trim());
  if (ym) {
    return new Date(Number(ym[1]), Number(ym[2]) - 1, 1);
  }
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateString.trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(dateString);
}

function isOngoing(entry) {
  const raw = entry.date;
  if (typeof raw !== 'string') return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === 'ongoing' || normalized === 'current';
}

/** A date like "2026-05" names only the publication month. */
function isMonthOnly(entry) {
  return typeof entry.date === 'string' && /^\d{4}-\d{1,2}$/.test(entry.date.trim());
}

function formatDisplayDate(entry) {
  if (isOngoing(entry)) return 'ongoing';
  if (!entry.date) return '';
  const date = parseLocalDate(entry.date);
  if (isNaN(date.getTime())) return entry.date;
  if (isMonthOnly(entry)) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(entry) {
  if (isOngoing(entry)) return 'ongoing';
  if (!entry.date) return '';
  const date = parseLocalDate(entry.date);
  if (isNaN(date.getTime())) return entry.date;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function sortTimestamp(entry) {
  if (isOngoing(entry)) return Infinity;
  if (!entry.date) return 0;
  const date = parseLocalDate(entry.date);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

/** Venue tags for an entry: `venue` may be a string or an array of tags. */
function venueList(entry) {
  if (Array.isArray(entry.venue)) return entry.venue;
  if (entry.venue) return [entry.venue];
  const url = entry.url || '';
  if (url.includes('arxiv.org')) return ['arXiv'];
  if (url.includes('lesswrong.com')) return ['LessWrong'];
  if (entry.filename) return ['preprint'];
  return ['link'];
}

/**
 * Title link target: papers go to their landing page, notes go out.
 * A paper marked noPdf with an external url links straight out too.
 */
function titleHref(entry) {
  if (entry.filename && !(entry.noPdf && entry.url)) return `papers/${entry.filename}.html`;
  return entry.url;
}

/**
 * Small links under a list-page row: direct pdf, external venue, slides,
 * plus any extraLinks ({label, url}) from content.json. Notes have no pdf
 * and their title already points at the external url, so the url link is
 * only added for papers.
 */
/** Chip label for an external url, by where it points. */
function urlChipLabel(url) {
  if (url.includes('arxiv.org')) return 'arxiv';
  if (url.includes('lesswrong.com')) return 'lesswrong';
  if (url.includes('queerinai.com')) return 'workshop';
  if (url.includes('tais')) return 'proceedings';
  if (url.includes('apartresearch.com')) return 'project';
  return 'publication';
}

function rowLinks(entry) {
  const links = [];
  const onArxiv = (entry.url || '').includes('arxiv.org');
  if (entry.filename) {
    if (!onArxiv && !entry.noPdf) {
      links.push({ label: 'pdf', href: entry.pdfUrl || `pdfs/${entry.filename}.pdf` });
    }
    if (entry.url && titleHref(entry) !== entry.url) {
      links.push({ label: urlChipLabel(entry.url), href: entry.url });
    }
  }
  (entry.extraLinks || []).forEach(link => {
    if (link && link.label && link.url) links.push({ label: link.label, href: link.url });
  });
  if (entry.slides) {
    links.push({ label: 'slides', href: entry.slides });
  }
  return links;
}

function linkAttrs(href) {
  return /^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
}

/**
 * Append a short content hash to an image URL so browsers refetch when the
 * file changes. Same content keeps the same URL, so builds stay stable.
 */
function versionedImage(imagePath) {
  try {
    const file = fs.readFileSync(path.join(SITE_ROOT, imagePath));
    const hash = crypto.createHash('md5').update(file).digest('hex').slice(0, 8);
    return `${imagePath}?v=${hash}`;
  } catch {
    return imagePath;
  }
}

function thumbHTML(entry, href) {
  if (entry.image) {
    return `<a class="ua-thumb" href="${esc(href)}"${linkAttrs(href)} tabindex="-1" aria-hidden="true"><img src="${esc(versionedImage(entry.image))}" alt="" loading="lazy"></a>`;
  }
  return `<a class="ua-thumb ua-thumb--empty" href="${esc(href)}"${linkAttrs(href)} tabindex="-1" aria-hidden="true"><span>▪</span></a>`;
}

/** Homepage entry: figure thumb, title, one meta line. */
function renderThreadEntry(entry) {
  const href = titleHref(entry);
  const venues = venueList(entry)
    .map(v => `<span class="ua-row__venue">${esc(v)}</span>`)
    .join('');
  return `                <li class="ua-row">
                    ${thumbHTML(entry, href)}
                    <div class="ua-row__body">
                        <a class="ua-row__title" href="${esc(href)}"${linkAttrs(href)}>${esc(entry.displayName)}</a>
                        <div class="ua-row__meta">${venues}<span class="ua-row__date">${esc(formatShortDate(entry))}</span></div>
                    </div>
                </li>`;
}

function renderThread(thread, entries, index) {
  const number = String(index + 1).padStart(2, '0');
  const tone = THREAD_TONES[index % THREAD_TONES.length];
  const items = entries.map(renderThreadEntry).join('\n');
  return `        <section class="ua-thread ua-thread--${tone}" aria-labelledby="thread-${esc(thread.id)}">
            <div class="ua-thread__intro">
                <div class="ua-thread__eyebrow"><span class="ua-thread__num">${number}</span></div>
                <h2 class="ua-thread__title" id="thread-${esc(thread.id)}">${esc(thread.title)}</h2>
                <p class="ua-thread__narrative">${esc(thread.narrative)}</p>
            </div>
            <ol class="ua-thread__list" role="list">
${items}
            </ol>
        </section>`;
}

/** List-page row: figure thumb, then title/meta/description/links. */
function renderListRow(entry, tone) {
  const href = titleHref(entry);
  const links = rowLinks(entry)
    .map(l => `<a href="${esc(l.href)}"${linkAttrs(l.href)}>${esc(l.label)}</a>`)
    .join('\n                            ');
  const linksBlock = links
    ? `                        <div class="ua-item__links">
                            ${links}
                        </div>\n`
    : '';

  return `                <li class="ua-item ua-item--${tone}">
                    ${thumbHTML(entry, href)}
                    <div class="ua-item__body">
                        <div class="ua-item__head">
                            <a class="ua-item__title" href="${esc(href)}"${linkAttrs(href)}>${esc(entry.displayName)}</a>
                            <div class="ua-item__meta">
                                <span class="ua-item__venues">${venueList(entry)
                                  .map(v => `<span class="ua-item__venue">${esc(v)}</span>`)
                                  .join('')}</span>
                                <span class="ua-item__date">${esc(formatDisplayDate(entry))}</span>
                            </div>
                        </div>
${entry.description ? `                        <p class="ua-item__desc">${esc(entry.description)}</p>\n` : ''}${linksBlock}                    </div>
                </li>`;
}

const SHARED_CSS = `
        :root {
            --ua-paper: #F7F8FC;
            --ua-panel: #FFFFFF;
            --ua-ink: #17171E;
            --ua-ink-soft: #3D3E4A;
            --ua-ink-faint: #6E7080;
            --ua-accent: #4E5BD8;
            --ua-accent-ink: #3D48B4;
            --ua-line: #DCDFEC;
            --ua-bar: #191A22;
            --ua-rose-ink: #B0566F;
            --ua-rose-wash: #FAEDF2;
            --ua-peri-ink: #3D48B4;
            --ua-peri-wash: #EBEDFB;
            --ua-peach-ink: #B06032;
            --ua-peach-wash: #FBF0E7;
            --ua-display: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
            --ua-body: 'Inter', 'Helvetica Neue', Arial, sans-serif;
            --ua-mono: 'Roboto Mono', monospace;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        html, body {
            min-height: 100%;
            background-color: var(--ua-paper);
            color: var(--ua-ink);
            font-family: var(--ua-body);
            -webkit-font-smoothing: antialiased;
        }

        ::selection { background: var(--ua-rose-ink); color: #fff; }

        a { color: inherit; }

        a:focus-visible {
            outline: 2px solid var(--ua-accent);
            outline-offset: 2px;
            border-radius: 2px;
        }

        .ua-topbar {
            background: var(--ua-bar);
            color: rgba(255, 255, 255, 0.92);
            font-family: var(--ua-mono);
            font-size: 0.62rem;
            font-weight: 500;
            letter-spacing: 1.6px;
            text-transform: uppercase;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem 1.5rem;
        }

        .ua-topbar a { color: inherit; text-decoration: none; }
        .ua-topbar a:hover { color: #fff; }

        .ua-thumb {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ua-thumb img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            -webkit-mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, #000 62%, transparent 96%);
            mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, #000 62%, transparent 96%);
        }

        .ua-thumb--empty {
            font-family: var(--ua-mono);
            font-size: 0.7rem;
            background: radial-gradient(ellipse at center, var(--t-wash, var(--ua-peri-wash)) 55%, transparent 90%);
            color: var(--t-ink, var(--ua-accent-ink));
            border-radius: 12px;
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation: none !important;
                transition: none !important;
            }
            html { scroll-behavior: auto; }
        }
`;

const TOPBAR_HTML = `    <div class="ua-topbar">
        <span>▪ AI safety · alignment research</span>
        <a href="${BASE_URL}">unrulyabstractions.com</a>
    </div>`;

function generateIndexHTML(content) {
  const about = content.about || {};
  const threads = content.threads || [];
  const byKey = new Map();
  (content.papers || []).forEach(p => byKey.set(p.filename, p));
  (content.notes || []).forEach(n => byKey.set(n.id || n.url, n));

  const threadSections = threads
    .map((thread, i) => {
      const entries = (thread.items || [])
        .map(item => {
          const entry = byKey.get(item);
          if (!entry) console.warn(`⚠️  Thread "${thread.id}" references unknown item "${item}"`);
          return entry;
        })
        .filter(Boolean);
      return renderThread(thread, entries, i);
    })
    .join('\n');

  const inThreads = new Set(threads.flatMap(t => t.items || []));
  [...byKey.entries()].forEach(([key, entry]) => {
    if (!inThreads.has(key)) {
      console.warn(`⚠️  "${entry.displayName}" (${key}) is in no thread; it appears only on all.html`);
    }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Unruly Abstractions - AI Safety, Interpretability & Alignment Research</title>
    <meta name="description" content="${esc(about.tagline)} ${esc(about.credo)}">
    <meta name="keywords" content="AI Safety, AI Alignment, Interpretability, Mechanistic Interpretability, Evals, LLM Bias, Homogenization, Differential Treatment, Machine Learning Safety">
    <meta name="author" content="Unruly Abstractions">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${BASE_URL}">
    <meta property="og:title" content="Unruly Abstractions - AI Safety & Interpretability Research">
    <meta property="og:description" content="${esc(about.credo)}">
    <meta property="og:site_name" content="Unruly Abstractions">
    <meta property="og:image" content="${BASE_URL}/img/og.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@unrulyabstract">
    <meta name="twitter:creator" content="@unrulyabstract">
    <meta name="twitter:title" content="Unruly Abstractions - AI Safety Research">
    <meta name="twitter:description" content="${esc(about.credo)}">
    <meta name="twitter:image" content="${BASE_URL}/img/og.png">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>">
    <link rel="canonical" href="${BASE_URL}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400;500;600&display=swap" rel="stylesheet">

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Unruly Abstractions",
      "url": "${BASE_URL}",
      "sameAs": [
        "https://x.com/unrulyabstract",
        "https://unrulyabstractions.substack.com/about",
        "https://www.lesswrong.com/users/unruly-abstractions",
        "https://scholar.google.com/citations?user=9T_3YJcAAAAJ&hl=en"
      ],
      "description": "${esc(about.credo)}",
      "email": "ian@unrulyabstractions.com",
      "knowsAbout": [
        "AI Safety",
        "AI Alignment",
        "Mechanistic Interpretability",
        "Evals",
        "LLM Bias",
        "Homogenization",
        "Differential Treatment"
      ],
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${BASE_URL}"
      }
    }
    </script>

    <style>
${SHARED_CSS}
        .ua-hero {
            background:
                linear-gradient(180deg, rgba(247, 248, 252, 0) 0%, rgba(247, 248, 252, 0) 55%, var(--ua-paper) 100%),
                linear-gradient(120deg, var(--ua-rose-wash) 0%, var(--ua-peri-wash) 68%, var(--ua-peach-wash) 100%);
        }

        .ua-hero__inner {
            max-width: 1160px;
            margin: 0 auto;
            padding: 3.2rem 2rem 2.6rem;
            display: flex;
            align-items: center;
            gap: 3rem;
        }

        .ua-hero__text { flex: 1; min-width: 0; }

        .ua-hero__name {
            font-family: var(--ua-display);
            font-size: 3rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            line-height: 1.05;
            text-transform: lowercase;
        }

        .ua-hero__interests {
            margin-top: 0.6rem;
            font-family: var(--ua-mono);
            font-size: 0.78rem;
            font-weight: 500;
            letter-spacing: 0.5px;
            color: var(--ua-accent-ink);
        }

        .ua-hero__statement {
            margin-top: 0.85rem;
            font-size: 1rem;
            line-height: 1.6;
            color: var(--ua-ink-soft);
            max-width: 36rem;
        }

        .ua-hero__statement strong { display: block; color: var(--ua-ink); font-weight: 600; margin-bottom: 0.3rem; }

        .ua-hero__links {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1.4rem;
        }

        .ua-chip {
            font-family: var(--ua-mono);
            font-size: 0.68rem;
            font-weight: 500;
            letter-spacing: 0.4px;
            color: var(--ua-ink-soft);
            text-decoration: none;
            padding: 0.32rem 0.75rem;
            border: 1px solid rgba(23, 23, 30, 0.18);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.65);
            transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
            white-space: nowrap;
        }

        .ua-chip:hover { border-color: var(--ua-accent); color: var(--ua-accent-ink); background: #fff; }

        .ua-hero__logo {
            height: 118px;
            width: auto;
            flex-shrink: 0;
        }

        .ua-page {
            max-width: 1160px;
            margin: 0 auto;
            padding: 1.2rem 2rem 3rem;
        }

        .ua-thread {
            display: grid;
            grid-template-columns: 290px 1fr;
            gap: 3rem;
            padding: 2.3rem 0;
            border-top: 1px solid var(--ua-line);
        }

        .ua-thread:first-of-type { border-top: none; }

        .ua-thread--rose  { --t-ink: var(--ua-rose-ink);  --t-wash: var(--ua-rose-wash); }
        .ua-thread--peri  { --t-ink: var(--ua-peri-ink);  --t-wash: var(--ua-peri-wash); }
        .ua-thread--peach { --t-ink: var(--ua-peach-ink); --t-wash: var(--ua-peach-wash); }

        .ua-thread__eyebrow {
            font-family: var(--ua-mono);
            font-size: 0.62rem;
            font-weight: 600;
            letter-spacing: 1.6px;
            text-transform: uppercase;
            color: var(--ua-ink-faint);
        }

        .ua-thread__num {
            display: inline-block;
            font-size: 0.7rem;
            color: var(--t-ink);
            background: var(--t-wash);
            border-radius: 5px;
            padding: 0.12rem 0.4rem;
            margin-right: 0.35rem;
        }

        .ua-thread__title {
            font-family: var(--ua-display);
            font-size: 1.55rem;
            font-weight: 600;
            letter-spacing: -0.2px;
            text-transform: lowercase;
            margin-top: 0.6rem;
        }

        .ua-thread__narrative {
            margin-top: 0.7rem;
            font-size: 0.9rem;
            line-height: 1.6;
            color: var(--ua-ink-soft);
        }

        .ua-thread__list { display: flex; flex-direction: column; }

        .ua-row {
            list-style: none;
            display: flex;
            align-items: center;
            gap: 1.3rem;
            padding: 0.8rem 0.8rem;
            margin: 0 -0.8rem;
            border-radius: 12px;
            border-top: 1px solid var(--ua-line);
            transition: background 0.15s ease;
        }

        .ua-row:first-child { border-top: none; }

        .ua-row:hover { background: var(--t-wash); }

        .ua-row:hover + .ua-row { border-top-color: transparent; }

        .ua-row .ua-thumb { width: 138px; height: 88px; }

        .ua-row:hover .ua-thumb img { -webkit-mask-image: none; mask-image: none; }

        .ua-row__body { flex: 1; min-width: 0; }

        .ua-row__title {
            display: block;
            font-family: var(--ua-body);
            font-size: 1rem;
            font-weight: 500;
            line-height: 1.5;
            color: var(--ua-ink);
            text-decoration: none;
        }

        .ua-row__title:hover { color: var(--t-ink); }

        .ua-row__meta {
            margin-top: 0.4rem;
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 0.45rem;
            font-family: var(--ua-mono);
            font-size: 0.62rem;
            font-weight: 500;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }

        .ua-row__venue {
            color: var(--t-ink);
            background: var(--t-wash);
            padding: 0.1rem 0.5rem;
            border-radius: 4px;
            white-space: nowrap;
        }

        .ua-row__date { margin-left: 0.35rem; }

        .ua-row__date { color: var(--ua-ink-faint); }

        .ua-footer {
            border-top: 2px solid var(--ua-ink);
            padding-top: 1.4rem;
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            justify-content: space-between;
            gap: 1rem;
        }

        .ua-footer__all {
            font-family: var(--ua-mono);
            font-size: 0.72rem;
            font-weight: 600;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            color: var(--ua-ink);
            text-decoration: none;
        }

        .ua-footer__all:hover { color: var(--ua-rose-ink); }

        .ua-footer__archive {
            font-family: var(--ua-mono);
            font-size: 0.64rem;
            letter-spacing: 0.5px;
            color: var(--ua-ink-faint);
        }

        .ua-footer__archive a { color: var(--ua-ink-soft); text-decoration: none; border-bottom: 1px solid var(--ua-line); }

        .ua-footer__archive a:hover { color: var(--ua-rose-ink); border-bottom-color: var(--ua-rose-ink); }

        @media (max-width: 880px) {
            .ua-hero__inner { flex-direction: column-reverse; gap: 1.4rem; padding: 2.2rem 1.2rem 2rem; }

            .ua-hero__logo { height: 84px; }

            .ua-hero__name { font-size: 2.1rem; }

            .ua-page { padding: 0.6rem 1.2rem 2.5rem; }

            .ua-thread { grid-template-columns: 1fr; gap: 1.4rem; padding: 1.8rem 0; }

            .ua-row { align-items: flex-start; }

            .ua-row .ua-thumb { width: 96px; height: 68px; }

            .ua-row__meta { flex-wrap: wrap; }

            .ua-footer { flex-direction: column; }
        }
    </style>
</head>
<body>
${TOPBAR_HTML}
    <header class="ua-hero">
        <div class="ua-hero__inner">
            <div class="ua-hero__text">
                <h1 class="ua-hero__name">${esc(about.name)}</h1>
                <p class="ua-hero__interests">${esc(about.interests)}</p>
                <p class="ua-hero__statement"><strong>${esc(about.tagline)}</strong>${esc(about.credo)}</p>
                <nav class="ua-hero__links" aria-label="External profiles">
                    <a href="https://github.com/unrulyabstractions" class="ua-chip" target="_blank" rel="noopener noreferrer">github</a>
                    <a href="https://scholar.google.com/citations?user=9T_3YJcAAAAJ&hl=en" class="ua-chip" target="_blank" rel="noopener noreferrer">google scholar</a>
                    <a href="https://www.lesswrong.com/users/unruly-abstractions" class="ua-chip" target="_blank" rel="noopener noreferrer">lesswrong</a>
                    <a href="https://x.com/unrulyabstract" class="ua-chip" target="_blank" rel="noopener noreferrer">twitter</a>
                    <a href="mailto:ian@unrulyabstractions.com" class="ua-chip">email</a>
                    <a href="contact/resume.pdf" class="ua-chip" target="_blank" rel="noopener noreferrer">resume</a>
                    <a href="contact/card.pdf" class="ua-chip" target="_blank" rel="noopener noreferrer">contact card</a>
                </nav>
            </div>
            <img src="img/icon.svg" alt="Unruly Abstractions logo" class="ua-hero__logo">
        </div>
    </header>
    <div class="ua-page">
        <main class="ua-threads">
${threadSections}
        </main>

        <footer class="ua-footer">
            <a href="all.html" class="ua-footer__all">all work, chronologically →</a>
            <span class="ua-footer__archive">archive by topic:
                <a href="llmbias.html">llm social bias</a> ·
                <a href="interpretability.html">interpretability</a> ·
                <a href="differentialtreatment.html">ai control</a>
            </span>
        </footer>
    </div>
</body>
</html>
`;
}

function generateListHTML({ title, pageTitle, description, canonicalFile, entries }) {
  const rows = entries
    .map((entry, i) => renderListRow(entry, THREAD_TONES[i % THREAD_TONES.length]))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(pageTitle)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="Unruly Abstractions">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>">
    <link rel="canonical" href="${BASE_URL}/${canonicalFile}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
${SHARED_CSS}
        .ua-container {
            max-width: 880px;
            margin: 0 auto;
            padding: 3rem 1.4rem 3.5rem;
        }

        .ua-crumb {
            font-family: var(--ua-mono);
            font-size: 0.68rem;
            font-weight: 500;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: var(--ua-ink-faint);
            text-decoration: none;
        }

        .ua-crumb:hover { color: var(--ua-accent-ink); }

        .ua-title {
            font-family: var(--ua-display);
            font-size: 2.3rem;
            font-weight: 700;
            letter-spacing: -0.4px;
            text-transform: lowercase;
            margin: 0.8rem 0 0.4rem;
        }

        .ua-subtitle {
            font-size: 0.92rem;
            line-height: 1.55;
            color: var(--ua-ink-soft);
            max-width: 44rem;
            margin-bottom: 1.8rem;
        }

        .ua-list {
            display: flex;
            flex-direction: column;
            border-top: 2px solid var(--ua-ink);
        }

        .ua-item {
            list-style: none;
            display: flex;
            gap: 1.5rem;
            padding: 1.35rem 0;
            border-bottom: 1px solid var(--ua-line);
        }

        .ua-item--rose  { --t-ink: var(--ua-rose-ink);  --t-wash: var(--ua-rose-wash); }
        .ua-item--peri  { --t-ink: var(--ua-peri-ink);  --t-wash: var(--ua-peri-wash); }
        .ua-item--peach { --t-ink: var(--ua-peach-ink); --t-wash: var(--ua-peach-wash); }

        .ua-item .ua-thumb { width: 168px; height: 110px; }


        .ua-item__body { flex: 1; min-width: 0; }

        .ua-item__head {
            display: flex;
            align-items: baseline;
            gap: 2rem;
        }

        .ua-item__title {
            flex: 1;
            font-family: var(--ua-body);
            font-size: 1.06rem;
            font-weight: 600;
            line-height: 1.5;
            color: var(--ua-ink);
            text-decoration: none;
        }

        .ua-item__title:hover { color: var(--t-ink); }

        .ua-item__meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.35rem;
            font-family: var(--ua-mono);
            font-size: 0.62rem;
            font-weight: 500;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            white-space: nowrap;
        }

        .ua-item__venues {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 0.35rem;
            max-width: 16rem;
        }

        .ua-item__venue {
            color: var(--t-ink);
            background: var(--t-wash);
            padding: 0.1rem 0.5rem;
            border-radius: 4px;
        }

        .ua-item__date { color: var(--ua-ink-faint); }

        .ua-item__desc {
            margin-top: 0.45rem;
            font-size: 0.87rem;
            line-height: 1.6;
            color: var(--ua-ink-soft);
            max-width: 38rem;
        }

        .ua-item__links {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.7rem;
        }

        .ua-item__links a {
            font-family: var(--ua-mono);
            font-size: 0.6rem;
            font-weight: 500;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            color: var(--ua-ink-soft);
            text-decoration: none;
            padding: 0.22rem 0.6rem;
            border: 1px solid var(--ua-line);
            border-radius: 999px;
            background: var(--ua-panel);
            transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }

        .ua-item__links a:hover { border-color: var(--t-ink); color: var(--t-ink); background: var(--t-wash); }

        @media (max-width: 720px) {
            .ua-item { flex-direction: column; gap: 0.8rem; }

            .ua-item .ua-thumb { width: 100%; height: 130px; }

            .ua-item__head { flex-direction: column; gap: 0.35rem; }

            .ua-item__meta { flex-direction: row; align-items: baseline; gap: 0.9rem; }
        }
    </style>
</head>
<body>
${TOPBAR_HTML}
    <div class="ua-container">
        <a href="./" class="ua-crumb">← unruly abstractions</a>
        <h1 class="ua-title">${esc(title)}</h1>
        <p class="ua-subtitle">${esc(description)}</p>
        <ol class="ua-list" role="list">
${rows}
        </ol>
    </div>
</body>
</html>
`;
}

function main() {
  console.log('🏠 Generating index.html, all.html, and topic pages from config...\n');

  let content, geometry;
  try {
    content = JSON.parse(fs.readFileSync(CONTENT_JSON_PATH, 'utf8'));
    geometry = JSON.parse(fs.readFileSync(GEOMETRY_JSON_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ Error reading config:', error.message);
    process.exit(1);
  }

  if (!Array.isArray(content.threads) || content.threads.length === 0) {
    console.error('❌ content.json has no "threads"; refusing to generate an empty homepage.');
    process.exit(1);
  }

  const everything = [...(content.papers || []), ...(content.notes || [])];
  everything.forEach(entry => {
    if (entry.image && !fs.existsSync(path.join(SITE_ROOT, entry.image))) {
      console.warn(`⚠️  Missing image file: ${entry.image} (${entry.displayName})`);
    }
  });

  fs.writeFileSync(path.join(SITE_ROOT, 'index.html'), generateIndexHTML(content), 'utf8');
  console.log('✅ Generated: index.html');

  const allHtml = generateListHTML({
    title: 'all work',
    pageTitle: 'All Work - Unruly Abstractions',
    description: 'Every paper, proceeding, and research note, in chronological order.',
    canonicalFile: 'all.html',
    entries: [...everything].sort((a, b) => sortTimestamp(b) - sortTimestamp(a)),
  });
  fs.writeFileSync(path.join(SITE_ROOT, 'all.html'), allHtml, 'utf8');
  console.log('✅ Generated: all.html');

  (geometry.columns || []).forEach(column => {
    if (!column.topic || !column.detailPage) return;
    const file = path.basename(column.detailPage);
    const entries = everything
      .filter(entry => entry.topic === column.topic)
      .sort((a, b) => sortTimestamp(b) - sortTimestamp(a));
    const html = generateListHTML({
      title: column.label,
      pageTitle: `${column.label
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')} - AI Safety Research | Unruly Abstractions`,
      description: column.description || `Research on ${column.label} from Unruly Abstractions.`,
      canonicalFile: file,
      entries,
    });
    fs.writeFileSync(path.join(SITE_ROOT, file), html, 'utf8');
    console.log(`✅ Generated: ${file} (${entries.length} entries)`);
  });

  console.log('\n✨ Done!');
}

main();
