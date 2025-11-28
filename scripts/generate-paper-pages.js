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

// Configuration
const CONTENT_JSON_PATH = path.join(__dirname, '../config/content.json');
const PAPERS_DIR = path.join(__dirname, '../papers');
const BASE_URL = 'https://www.unrulyabstractions.com';

/**
 * Format date as YYYY/MM/DD for citation_publication_date
 */
function formatCitationDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0].replace(/-/g, '/');

  const normalized = dateString.trim().toLowerCase();
  if (normalized === 'ongoing' || normalized === 'current') {
    return new Date().toISOString().split('T')[0].replace(/-/g, '/');
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0].replace(/-/g, '/');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Format date as YYYY-MM-DD for Schema.org datePublished
 */
function formatSchemaDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];

  const normalized = dateString.trim().toLowerCase();
  if (normalized === 'ongoing' || normalized === 'current') {
    return new Date().toISOString().split('T')[0];
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return date.toISOString().split('T')[0];
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

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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

    <!-- Google Scholar Meta Tags -->
    <meta name="citation_title" content="${displayName}">
    <meta name="citation_author" content="Unruly Abstractions">
    <meta name="citation_publication_date" content="${citationDate}">
    <meta name="citation_online_date" content="${citationDate}">
    <meta name="citation_pdf_url" content="${pdfUrl}">
    <meta name="citation_abstract_html_url" content="${pageUrl}">
    <meta name="citation_language" content="en">
    <meta name="citation_keywords" content="${keywords}">
    <meta name="citation_technical_report_institution" content="Unruly Abstractions">

    <!-- Dublin Core Meta Tags (additional academic metadata) -->
    <meta name="DC.title" content="${displayName}">
    <meta name="DC.creator" content="Unruly Abstractions">
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
        "name": "Unruly Abstractions",
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

    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f5f5;
            color: #333;
        }
        .paper-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 0.5rem;
        }
        .meta {
            color: #7f8c8d;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }
        .links {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #2980b9;
        }
        .btn-secondary {
            background: #95a5a6;
        }
        .btn-secondary:hover {
            background: #7f8c8d;
        }
        .description {
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .abstract {
            background: #f8f9fa;
            padding: 1.5rem;
            border-left: 4px solid #3498db;
            margin: 1.5rem 0;
            border-radius: 4px;
        }
        .abstract h2 {
            margin-top: 0;
            font-size: 1rem;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="paper-container">
        <h1>${displayName}</h1>
        <div class="meta">
            <p><strong>Author:</strong> Unruly Abstractions</p>
            ${date ? `<p><strong>Date:</strong> ${displayDate}</p>` : ''}
            <p><strong>Category:</strong> ${titleCase(category)}</p>
        </div>
        ${description ? `<div class="abstract">
            <h2>Abstract</h2>
            <p>${description}</p>
        </div>` : ''}
        <div class="links">
            <a href="../pdfs/${filename}.pdf" class="btn" target="_blank" rel="noopener noreferrer">View PDF</a>${slides ? `
            <a href="${slides}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">View Slides</a>` : ''}
            <a href="../" class="btn btn-secondary">Back to Home</a>
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
