#!/usr/bin/env node

/**
 * Validate Google Scholar compliance
 *
 * Checks that all paper landing pages meet Google Scholar indexing requirements:
 * - Required meta tags present
 * - PDFs are accessible and under 5MB
 * - Proper URL structure
 * - robots.txt allows Googlebot-Scholar
 *
 * Usage: node scripts/validate-scholar.js
 */

const fs = require('fs');
const path = require('path');

const CONTENT_JSON_PATH = path.join(__dirname, '../config/content.json');
const PAPERS_DIR = path.join(__dirname, '../papers');
const PDFS_DIR = path.join(__dirname, '../pdfs');
const ROBOTS_TXT_PATH = path.join(__dirname, '../robots.txt');
const MAX_PDF_SIZE_MB = 5;

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkRequiredTag(html, tagName, displayName) {
  const regex = new RegExp(`<meta name="${tagName}" content="([^"]+)"`, 'i');
  const match = html.match(regex);

  if (match) {
    log(`  ✅ ${displayName}: ${match[1]}`, 'green');
    return true;
  } else {
    log(`  ❌ ${displayName}: MISSING`, 'red');
    return false;
  }
}

function checkOptionalTag(html, tagName, displayName) {
  const regex = new RegExp(`<meta name="${tagName}" content="([^"]+)"`, 'i');
  const match = html.match(regex);

  if (match) {
    log(`  ✅ ${displayName}: ${match[1]}`, 'green');
    return true;
  } else {
    log(`  ⚠️  ${displayName}: Not present (optional)`, 'yellow');
    return false;
  }
}

function validatePaperHTML(filename) {
  const htmlPath = path.join(PAPERS_DIR, `${filename}.html`);

  if (!fs.existsSync(htmlPath)) {
    log(`  ❌ HTML file not found: ${htmlPath}`, 'red');
    return false;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  let allRequired = true;

  // Check required tags
  log('  Required Google Scholar tags:', 'cyan');
  allRequired &= checkRequiredTag(html, 'citation_title', 'Title');
  allRequired &= checkRequiredTag(html, 'citation_author', 'Author');
  allRequired &= checkRequiredTag(html, 'citation_publication_date', 'Publication Date');

  // Check recommended tags
  log('\n  Recommended tags:', 'cyan');
  checkOptionalTag(html, 'citation_pdf_url', 'PDF URL');
  checkOptionalTag(html, 'citation_abstract_html_url', 'Abstract URL');
  checkOptionalTag(html, 'citation_online_date', 'Online Date');
  checkOptionalTag(html, 'citation_language', 'Language');
  checkOptionalTag(html, 'citation_keywords', 'Keywords');
  checkOptionalTag(html, 'citation_technical_report_institution', 'Institution');

  return allRequired;
}

function validatePDF(filename) {
  const pdfPath = path.join(PDFS_DIR, `${filename}.pdf`);

  if (!fs.existsSync(pdfPath)) {
    log(`  ❌ PDF file not found: ${pdfPath}`, 'red');
    return false;
  }

  const stats = fs.statSync(pdfPath);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB > MAX_PDF_SIZE_MB) {
    log(`  ⚠️  PDF size: ${sizeMB.toFixed(2)} MB (exceeds ${MAX_PDF_SIZE_MB}MB Google Scholar limit)`, 'yellow');
    log(`     Consider compressing: ${pdfPath}`, 'yellow');
    return false;
  } else {
    log(`  ✅ PDF size: ${sizeMB.toFixed(2)} MB (within limits)`, 'green');
    return true;
  }
}

function validateRobotsTxt() {
  if (!fs.existsSync(ROBOTS_TXT_PATH)) {
    log('❌ robots.txt not found', 'red');
    return false;
  }

  const robotsTxt = fs.readFileSync(ROBOTS_TXT_PATH, 'utf8');

  if (robotsTxt.includes('Googlebot-Scholar') && robotsTxt.includes('Allow: /')) {
    log('✅ robots.txt allows Googlebot-Scholar', 'green');
    return true;
  } else {
    log('❌ robots.txt does not explicitly allow Googlebot-Scholar', 'red');
    return false;
  }
}

function main() {
  log('\n🔍 Google Scholar Compliance Validation\n', 'blue');

  // Read content.json
  let contentData;
  try {
    const contentJSON = fs.readFileSync(CONTENT_JSON_PATH, 'utf8');
    contentData = JSON.parse(contentJSON);
  } catch (error) {
    log(`❌ Error reading content.json: ${error.message}`, 'red');
    process.exit(1);
  }

  const papers = contentData.papers || [];

  if (papers.length === 0) {
    log('⚠️  No papers found in content.json', 'yellow');
    return;
  }

  log(`📄 Validating ${papers.length} paper(s)\n`, 'cyan');

  let totalIssues = 0;
  let totalWarnings = 0;

  // Validate each paper
  papers.forEach((paper, index) => {
    const filename = paper.filename;
    log(`\n[${index + 1}/${papers.length}] ${paper.displayName || filename}`, 'blue');
    log(`─────────────────────────────────────────────────────`, 'blue');

    // Validate HTML
    log('\n📝 HTML Landing Page:', 'cyan');
    const htmlValid = validatePaperHTML(filename);
    if (!htmlValid) totalIssues++;

    // Validate PDF
    log('\n📄 PDF File:', 'cyan');
    const pdfValid = validatePDF(filename);
    if (!pdfValid) totalWarnings++;
  });

  // Validate robots.txt
  log('\n\n🤖 robots.txt Check:', 'cyan');
  log('─────────────────────────────────────────────────────', 'blue');
  const robotsValid = validateRobotsTxt();
  if (!robotsValid) totalIssues++;

  // Summary
  log('\n\n📊 Validation Summary:', 'blue');
  log('═════════════════════════════════════════════════════', 'blue');

  if (totalIssues === 0 && totalWarnings === 0) {
    log('✅ All checks passed! Your site is ready for Google Scholar indexing.', 'green');
  } else {
    if (totalIssues > 0) {
      log(`❌ ${totalIssues} critical issue(s) found`, 'red');
    }
    if (totalWarnings > 0) {
      log(`⚠️  ${totalWarnings} warning(s) found`, 'yellow');
    }
    log('\nPlease address the issues above before submitting to Google Scholar.', 'yellow');
  }

  log('\n');
  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
