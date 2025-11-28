#!/usr/bin/env node

/**
 * Full deployment script
 *
 * Runs all build steps and validates before committing:
 * 1. Generate paper landing pages
 * 2. Update sitemap.xml
 * 3. Validate Google Scholar compliance
 * 4. Stage files for commit
 *
 * Usage: npm run deploy
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${description}...`, 'cyan');
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║                  🚀 DEPLOYMENT BUILD                       ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  const scriptsDir = path.join(__dirname);

  // Step 1: Generate paper pages
  if (!runCommand(
    `node ${path.join(scriptsDir, 'generate-paper-pages.js')}`,
    '📄 Step 1/3: Generating paper landing pages'
  )) {
    process.exit(1);
  }

  // Step 2: Update sitemap
  if (!runCommand(
    `node ${path.join(scriptsDir, 'update-sitemap.js')}`,
    '🗺️  Step 2/3: Updating sitemap.xml'
  )) {
    process.exit(1);
  }

  // Step 3: Validate
  log('\n🔍 Step 3/3: Validating Google Scholar compliance', 'cyan');
  const validateResult = runCommand(
    `node ${path.join(scriptsDir, 'validate-scholar.js')}`,
    ''
  );

  // Stage files
  log('\n📦 Staging files for commit...', 'cyan');
  try {
    execSync('git add papers/ sitemap.xml config/content.json', { stdio: 'inherit' });
    log('✅ Files staged', 'green');
  } catch (error) {
    log('⚠️  No changes to stage', 'yellow');
  }

  // Show status
  log('\n📊 Git status:', 'cyan');
  try {
    execSync('git status --short', { stdio: 'inherit' });
  } catch (error) {
    // Ignore error
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║                  ✅ DEPLOYMENT COMPLETE                     ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  if (!validateResult) {
    log('\n⚠️  WARNING: Validation found issues. Review output above.', 'yellow');
    log('You can still commit, but fix issues for optimal Google Scholar indexing.', 'yellow');
  }

  log('\nNext steps:', 'cyan');
  log('  1. Review the changes above', 'reset');
  log('  2. Commit: git commit -m "Your message"', 'reset');
  log('  3. Push: git push', 'reset');
  log('');
}

main();
