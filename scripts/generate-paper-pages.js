#!/usr/bin/env node

/**
 * Generate paper landing pages from content.json
 *
 * This script reads config/content.json and generates individual HTML landing pages
 * for each paper with Google Scholar metadata, Schema.org structured data, and
 * proper canonical URLs.
 *
 * Usage: node scripts/generate-paper-pages.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const CONTENT_JSON_PATH = path.join(__dirname, '../config/content.json');
const PAPERS_DIR = path.join(__dirname, '../papers');
const BASE_URL = 'https://www.unrulyabstractions.com';

/**
 * Parse a date string in local time.
 *
 * JavaScript parses bare YYYY-MM-DD strings as UTC midnight, which reads back
 * as the previous day in western timezones. Split those out and build the date
 * from its parts instead.
 */
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

/** A date like "2026-05" names only the publication month. */
function isMonthOnly(dateString) {
  return typeof dateString === 'string' && /^\d{4}-\d{1,2}$/.test(dateString.trim());
}

/**
 * Format a Date as YYYY-MM-DD using its local calendar day
 */
function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date as YYYY/MM/DD for citation_publication_date
 */
function formatCitationDate(dateString) {
  return formatSchemaDate(dateString).replace(/-/g, '/');
}

/**
 * Format date as YYYY-MM-DD for Schema.org datePublished
 */
function formatSchemaDate(dateString) {
  if (!dateString) return toISODate(new Date());

  const normalized = dateString.trim().toLowerCase();
  if (normalized === 'ongoing' || normalized === 'current') {
    return toISODate(new Date());
  }

  const date = parseLocalDate(dateString);
  if (isNaN(date.getTime())) {
    return toISODate(new Date());
  }

  if (isMonthOnly(dateString)) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  return toISODate(date);
}

/**
 * Format date for display (e.g., "October 7, 2025")
 */
function formatDisplayDate(dateString) {
  if (!dateString) return '';

  const normalized = dateString.trim().toLowerCase();
  if (normalized === 'ongoing' || normalized === 'current') {
    return 'Ongoing';
  }

  const date = parseLocalDate(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  if (isMonthOnly(dateString)) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Average the figure's color and soften it toward white, so each landing
 * page gets a pastel background tint drawn from its own figure. Falls back
 * to the site's periwinkle wash if ImageMagick is unavailable.
 */
function pastelTint(imagePath) {
  try {
    const out = execSync(
      `magick "${path.join(__dirname, '..', imagePath)}" -resize 1x1! txt:-`,
      { encoding: 'utf8' }
    );
    const match = /#([0-9A-Fa-f]{6})/.exec(out);
    if (!match) return '#EBEDFB';
    const rgb = [0, 1, 2].map(i => parseInt(match[1].slice(i * 2, i * 2 + 2), 16));
    const soft = rgb.map(v => Math.round(v + (255 - v) * 0.72));
    return `#${soft.map(v => v.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return '#EBEDFB';
  }
}

/**
 * Append a short content hash to an image URL so browsers refetch when the
 * file changes. Same content keeps the same URL, so builds stay stable.
 */
function versionedImage(imagePath) {
  try {
    const file = fs.readFileSync(path.join(__dirname, '..', imagePath));
    const hash = crypto.createHash('md5').update(file).digest('hex').slice(0, 8);
    return `${imagePath}?v=${hash}`;
  } catch {
    return imagePath;
  }
}

/**
 * Capitalize first letter of each word
 */
function titleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Generate HTML for a paper landing page
 */
function generatePaperHTML(paper) {
  const filename = paper.filename;
  const displayName = paper.displayName || filename;
  const category = paper.category || 'Research';
  const date = paper.date;
  const slides = paper.slides;
  const externalUrl = paper.url;
  const onArxiv = Boolean(externalUrl && externalUrl.includes('arxiv.org'));
  const externalLabel = !externalUrl
    ? 'View Publication'
    : onArxiv
      ? 'View on arXiv'
      : externalUrl.includes('queerinai.com')
        ? 'View in Workshop'
        : externalUrl.includes('tais')
          ? 'View in Proceedings'
          : externalUrl.includes('apartresearch.com')
            ? 'View Project'
            : 'View Publication';
  const tint = paper.image ? pastelTint(paper.image) : '#EBEDFB';
  const venueTags = Array.isArray(paper.venue) ? paper.venue : paper.venue ? [paper.venue] : [];
  const keywords = paper.keywords || `AI Safety, ${titleCase(category)}`;
  const description = paper.description || `Research paper on ${category}`;

  const citationDate = formatCitationDate(date);
  const schemaDate = formatSchemaDate(date);
  const displayDate = formatDisplayDate(date);

  const pdfUrl = `${BASE_URL}/pdfs/${filename}.pdf`;
  const pageUrl = `${BASE_URL}/papers/${filename}.html`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Page Title -->
    <title>${displayName} | Unruly Abstractions</title>

    <!-- Google Scholar Meta Tags (Highwire Press schema) -->
    <!-- Only officially supported tags per Google Scholar guidelines -->
    <meta name="citation_title" content="${displayName}">
    <meta name="citation_author" content="Ian Rios-Sialer">
    <meta name="citation_publication_date" content="${citationDate}">
    <meta name="citation_pdf_url" content="${pdfUrl}">
    <meta name="citation_technical_report_institution" content="Unruly Abstractions">

    <!-- Dublin Core Meta Tags (additional academic metadata) -->
    <meta name="DC.title" content="${displayName}">
    <meta name="DC.creator" content="Ian Rios-Sialer">
    <meta name="DC.date" content="${schemaDate}">
    <meta name="DC.type" content="Text">
    <meta name="DC.format" content="application/pdf">
    <meta name="DC.language" content="en">
    <meta name="DC.subject" content="${keywords.replace(/,/g, ';')}">

    <!-- Standard Meta Tags -->
    <meta name="description" content="${displayName} - ${description}">
    <meta name="keywords" content="${keywords}">
    <meta name="author" content="Unruly Abstractions">

    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${displayName}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${pageUrl}">
    <meta property="article:published_time" content="${schemaDate}">
    <meta property="article:author" content="Unruly Abstractions">
    <meta property="article:tag" content="${category}">

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${displayName}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:creator" content="@unrulyabstract">

    <!-- Canonical URL -->
    <link rel="canonical" href="${pageUrl}">

    <!-- Schema.org Structured Data for Google Scholar -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      "headline": "${displayName}",
      "name": "${displayName}",
      "author": {
        "@type": "Person",
        "name": "Ian Rios-Sialer",
        "alternateName": "Unruly Abstractions",
        "url": "${BASE_URL}"
      },
      "datePublished": "${schemaDate}",
      "description": "${description}",
      "keywords": "${keywords}",
      "inLanguage": "en",
      "isAccessibleForFree": true,
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "url": "${pageUrl}",
      "mainEntityOfPage": "${pageUrl}",
      "genre": "${category}",
      "encoding": {
        "@type": "MediaObject",
        "contentUrl": "${pdfUrl}",
        "encodingFormat": "application/pdf"
      }
    }
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
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
            --ua-display: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
            --ua-body: 'Inter', 'Helvetica Neue', Arial, sans-serif;
            --ua-mono: 'Roboto Mono', monospace;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { min-height: 100%; background: var(--ua-paper); }
        body { min-height: 100vh; background: linear-gradient(180deg, #FFFFFF 0%, ${tint} 42%, var(--ua-paper) 88%); color: var(--ua-ink); font-family: var(--ua-body); -webkit-font-smoothing: antialiased; }
        ::selection { background: var(--ua-accent); color: #fff; }
        a:focus-visible { outline: 2px solid var(--ua-accent); outline-offset: 2px; border-radius: 2px; }
        .ua-topbar { background: var(--ua-bar); color: rgba(255,255,255,0.92); font-family: var(--ua-mono); font-size: 0.62rem; font-weight: 500; letter-spacing: 1.6px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.5rem 1.5rem; }
        .ua-topbar a { color: inherit; text-decoration: none; }
        .ua-topbar a:hover { color: #fff; }
        .container { max-width: 760px; margin: 0 auto; padding: 3rem 1.4rem 3.5rem; }
        .crumb { font-family: var(--ua-mono); font-size: 0.68rem; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; color: var(--ua-ink-faint); text-decoration: none; }
        .crumb:hover { color: var(--ua-accent-ink); }
        h1 { font-family: var(--ua-display); font-size: 1.9rem; font-weight: 700; letter-spacing: -0.3px; line-height: 1.25; margin: 0.9rem 0 0.9rem; }
        .meta { display: flex; flex-wrap: wrap; gap: 0.9rem; font-family: var(--ua-mono); font-size: 0.64rem; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; color: var(--ua-ink-faint); margin-bottom: 1.6rem; }
        .meta .venue { color: var(--ua-accent-ink); background: rgba(78, 91, 216, 0.1); padding: 0.1rem 0.5rem; border-radius: 4px; }
        .figure { margin: 1.4rem 0 1.6rem; }
        .figure img { width: 100%; height: auto; max-height: 420px; object-fit: contain; display: block; -webkit-mask-image: radial-gradient(ellipse 98% 98% at 50% 50%, #000 58%, transparent 97%); mask-image: radial-gradient(ellipse 98% 98% at 50% 50%, #000 58%, transparent 97%); }
        .abstract { margin-bottom: 1.8rem; }
        .abstract h2 { font-family: var(--ua-mono); font-size: 0.64rem; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase; color: var(--ua-ink-faint); margin-bottom: 0.6rem; }
        .abstract p { font-size: 0.98rem; line-height: 1.7; color: var(--ua-ink-soft); max-width: 42rem; }
        .links { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .btn { font-family: var(--ua-mono); font-size: 0.68rem; font-weight: 500; letter-spacing: 0.6px; text-transform: uppercase; text-decoration: none; padding: 0.45rem 1rem; border-radius: 999px; border: 1px solid var(--ua-accent); color: var(--ua-accent-ink); background: var(--ua-panel); transition: background 0.15s ease, color 0.15s ease; }
        .btn-primary { background: var(--ua-accent); border-color: var(--ua-accent); color: #fff; }
        .btn:hover { background: var(--ua-accent-ink); border-color: var(--ua-accent-ink); color: #fff; }
        .btn-plain { border-color: var(--ua-line); color: var(--ua-ink-soft); }
    </style>
</head>
<body>
    <div class="ua-topbar">
        <span>▪ AI safety · alignment research</span>
        <a href="${BASE_URL}">unrulyabstractions.com</a>
    </div>
    <div class="container">
        <a href="../" class="crumb">← unruly abstractions</a>
        <h1>${displayName}</h1>
        <div class="meta">
            <span>Unruly Abstractions</span>${date ? `
            <span>${displayDate}</span>` : ''}
            <span>${titleCase(category)}</span>${venueTags.map(v => `
            <span class="venue">${v}</span>`).join('')}
        </div>
        ${paper.image ? `<div class="figure"><img src="../${versionedImage(paper.image)}" alt="Figure from ${displayName}"></div>
        ` : ''}${description ? `<div class="abstract">
            <h2>Abstract</h2>
            <p>${description}</p>
        </div>` : ''}
        <div class="links">${onArxiv || paper.noPdf ? `
            <a href="${externalUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${externalLabel}</a>` : `
            <a href="${paper.pdfUrl || `../pdfs/${filename}.pdf`}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">View PDF</a>${externalUrl ? `
            <a href="${externalUrl}" class="btn" target="_blank" rel="noopener noreferrer">${externalLabel}</a>` : ''}`}${slides ? `
            <a href="${slides}" class="btn" target="_blank" rel="noopener noreferrer">View Slides</a>` : ''}
            <a href="../" class="btn btn-plain">Back to Home</a>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Generating paper landing pages from content.json...\n');

  // Read content.json
  let contentData;
  try {
    const contentJSON = fs.readFileSync(CONTENT_JSON_PATH, 'utf8');
    contentData = JSON.parse(contentJSON);
  } catch (error) {
    console.error('❌ Error reading content.json:', error.message);
    process.exit(1);
  }

  // Ensure papers directory exists
  if (!fs.existsSync(PAPERS_DIR)) {
    fs.mkdirSync(PAPERS_DIR, { recursive: true });
    console.log('📁 Created papers directory\n');
  }

  // Get papers array
  const papers = contentData.papers || [];

  if (papers.length === 0) {
    console.log('⚠️  No papers found in content.json');
    return;
  }

  console.log(`📄 Found ${papers.length} paper(s) in content.json\n`);

  // Generate HTML for each paper
  let successCount = 0;
  let errorCount = 0;

  papers.forEach((paper) => {
    if (!paper.filename) {
      console.error(`⚠️  Skipping paper without filename:`, paper);
      errorCount++;
      return;
    }

    const filename = paper.filename;
    const htmlPath = path.join(PAPERS_DIR, `${filename}.html`);

    try {
      const html = generatePaperHTML(paper);
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log(`✅ Generated: papers/${filename}.html`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error generating ${filename}.html:`, error.message);
      errorCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log('\n✨ Done!');
}

// Run the script
main();
