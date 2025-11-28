#!/usr/bin/env node

/**
 * Update sitemap.xml with papers from content.json
 *
 * Automatically updates the sitemap to include all paper landing pages
 * and PDFs with proper lastmod dates and priorities.
 *
 * Usage: node scripts/update-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const CONTENT_JSON_PATH = path.join(__dirname, '../config/content.json');
const SITEMAP_PATH = path.join(__dirname, '../sitemap.xml');
const BASE_URL = 'https://www.unrulyabstractions.com';

function formatDate(dateString) {
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

function generateSitemap(papers) {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

    <!-- Homepage: highest priority, updated frequently -->
    <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>

    <!-- Papers page: high priority, updated when new papers published -->
    <url>
        <loc>${BASE_URL}/papers.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Research notes page: high priority, updated frequently -->
    <url>
        <loc>${BASE_URL}/notes.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Individual paper landing pages: high priority for Google Scholar -->
`;

  // Sort papers by date (newest first) for sitemap order
  const sortedPapers = [...papers].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });

  sortedPapers.forEach((paper) => {
    const lastmod = formatDate(paper.date);
    xml += `    <url>
        <loc>${BASE_URL}/papers/${paper.filename}.html</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>never</changefreq>
        <priority>0.9</priority>
    </url>

`;
  });

  xml += `    <!-- Individual papers (PDFs): medium priority, static content -->
`;

  sortedPapers.forEach((paper) => {
    const lastmod = formatDate(paper.date);
    xml += `    <url>
        <loc>${BASE_URL}/pdfs/${paper.filename}.pdf</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>never</changefreq>
        <priority>0.7</priority>
    </url>

`;
  });

  xml += `</urlset>
`;

  return xml;
}

function main() {
  console.log('🗺️  Updating sitemap.xml from content.json...\n');

  // Read content.json
  let contentData;
  try {
    const contentJSON = fs.readFileSync(CONTENT_JSON_PATH, 'utf8');
    contentData = JSON.parse(contentJSON);
  } catch (error) {
    console.error('❌ Error reading content.json:', error.message);
    process.exit(1);
  }

  const papers = contentData.papers || [];

  if (papers.length === 0) {
    console.log('⚠️  No papers found in content.json');
    return;
  }

  console.log(`📄 Found ${papers.length} paper(s)`);

  // Generate sitemap
  const sitemap = generateSitemap(papers);

  // Write sitemap
  try {
    fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');
    console.log(`✅ Updated sitemap.xml with ${papers.length * 2} paper URLs\n`);

    // Show preview
    console.log('📋 Preview:');
    papers.forEach((paper) => {
      console.log(`   - ${paper.displayName || paper.filename}`);
      console.log(`     HTML: ${BASE_URL}/papers/${paper.filename}.html`);
      console.log(`     PDF:  ${BASE_URL}/pdfs/${paper.filename}.pdf`);
    });

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error writing sitemap.xml:', error.message);
    process.exit(1);
  }
}

main();
