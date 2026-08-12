#!/usr/bin/env node

/**
 * Check LessWrong for posts that are not yet listed in config/content.json.
 *
 * Fetches every published post by the user via the LessWrong GraphQL API and
 * compares against the notes and papers already in content.json (matched by
 * post id inside the url). By default it only reports what is missing.
 *
 * With --write, missing posts are appended to "notes" with topic "unsorted"
 * and no thread membership, so they appear on all.html but not the homepage
 * until you assign them a thread in content.json.
 *
 * Usage:
 *   node scripts/sync-lesswrong.js          # report only
 *   node scripts/sync-lesswrong.js --write  # append missing posts to notes
 */

const fs = require('fs');
const path = require('path');

const CONTENT_JSON_PATH = path.join(__dirname, '../config/content.json');
const GRAPHQL_URL = 'https://www.lesswrong.com/graphql';
const USER_SLUG = 'unruly-abstractions';

async function gql(query) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error(`LessWrong GraphQL returned ${response.status}`);
  }
  const payload = await response.json();
  if (payload.errors) {
    throw new Error(`LessWrong GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }
  return payload.data;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 6)
    .join('-');
}

async function main() {
  const write = process.argv.includes('--write');

  const userData = await gql(
    `{ user(input: {selector: {slug: "${USER_SLUG}"}}) { result { _id displayName } } }`
  );
  const user = userData.user && userData.user.result;
  if (!user) {
    console.error(`❌ LessWrong user "${USER_SLUG}" not found`);
    process.exit(1);
  }

  const postsData = await gql(
    `{ posts(input: {terms: {view: "userPosts", userId: "${user._id}", limit: 100}}) { results { _id title pageUrl postedAt draft } } }`
  );
  const posts = (postsData.posts.results || []).filter(p => !p.draft);

  const content = JSON.parse(fs.readFileSync(CONTENT_JSON_PATH, 'utf8'));
  const entries = [...(content.papers || []), ...(content.notes || [])];
  const listedUrls = entries.map(entry => entry.url || '').join('\n');
  const listedTitles = new Set(
    entries.map(entry => (entry.displayName || '').trim().toLowerCase()).filter(Boolean)
  );

  // Posts inside a sequence that content.json lists by its /s/<id> url are
  // already covered; collect their ids so they are not reported as missing.
  const sequenceIds = [...listedUrls.matchAll(/lesswrong\.com\/s\/([A-Za-z0-9]+)/g)].map(m => m[1]);
  const coveredPostIds = new Set();
  for (const seqId of sequenceIds) {
    const seqData = await gql(
      `{ sequence(input: {selector: {_id: "${seqId}"}}) { result { chapters { posts { _id } } } } }`
    );
    const chapters = (seqData.sequence.result && seqData.sequence.result.chapters) || [];
    chapters.forEach(chapter =>
      (chapter.posts || []).forEach(post => coveredPostIds.add(post._id))
    );
  }

  const missing = posts.filter(
    post =>
      !listedUrls.includes(post._id) &&
      !coveredPostIds.has(post._id) &&
      !listedTitles.has(post.title.trim().toLowerCase())
  );

  console.log(`📡 ${posts.length} published post(s) on LessWrong for ${user.displayName}`);
  if (missing.length === 0) {
    console.log('✅ content.json already covers them all (directly, via a listed sequence, or by title match with a paper)');
    return;
  }

  console.log(`\n🆕 ${missing.length} post(s) not in content.json:`);
  missing.forEach(post => {
    console.log(`   - ${post.title}`);
    console.log(`     ${post.pageUrl} (${post.postedAt.slice(0, 10)})`);
  });

  if (!write) {
    console.log('\nRun with --write to append them to "notes" (topic "unsorted", no thread).');
    return;
  }

  content.notes = content.notes || [];
  missing.forEach(post => {
    content.notes.push({
      id: slugify(post.title),
      url: post.pageUrl,
      displayName: post.title,
      category: 'empirical',
      topic: 'unsorted',
      date: post.postedAt.slice(0, 10),
      description: '',
    });
  });

  fs.writeFileSync(CONTENT_JSON_PATH, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Appended ${missing.length} note(s) to config/content.json`);
  console.log('   Fill in description/category, assign each a thread, then run npm run deploy.');
}

main().catch(error => {
  console.error('❌', error.message);
  process.exit(1);
});
