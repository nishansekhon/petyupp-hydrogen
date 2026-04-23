#!/usr/bin/env node
/**
 * Audit every slug in app/lib/ugcManifest.js against Cloudinary.
 *
 * For each clip, HEAD-requests:
 *   https://res.cloudinary.com/petyupp-lifestyle/video/upload/{slug}.mp4
 *
 * Reports WORKS vs 404. For each 404, tries a set of common typo variations
 * (double/single underscores, case swaps, dash/underscore swaps) and reports
 * the first variation that returns 200 as the likely correct slug.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const manifestPath = resolve(REPO_ROOT, 'app/lib/ugcManifest.js');

const { ugcManifest } = await import(pathToFileURL(manifestPath).href);

const CLOUDINARY_VIDEO = 'https://res.cloudinary.com/petyupp-lifestyle/video/upload';

async function head(slug) {
  const url = `${CLOUDINARY_VIDEO}/${slug}.mp4`;
  try {
    const res = await fetch(url, {method: 'HEAD'});
    return {slug, status: res.status, ok: res.ok};
  } catch (err) {
    return {slug, status: 0, ok: false, error: err.message};
  }
}

function generateVariations(slug) {
  const variants = new Set();

  // Double-underscore fixes (both directions)
  if (slug.includes('__')) variants.add(slug.replace(/__/g, '_'));
  variants.add(slug.replace(/_/g, '__'));

  // Case swap on first letter
  variants.add(slug[0].toLowerCase() + slug.slice(1));
  variants.add(slug[0].toUpperCase() + slug.slice(1));

  // Case swap on every word boundary (after _)
  variants.add(slug.replace(/_([a-z])/g, (_, c) => `_${c.toUpperCase()}`));
  variants.add(slug.replace(/_([A-Z])/g, (_, c) => `_${c.toLowerCase()}`));

  // Dash/underscore swaps
  variants.add(slug.replace(/-/g, '_'));
  variants.add(slug.replace(/_/g, '-'));

  // Lowercase entire slug
  variants.add(slug.toLowerCase());

  // Remove trailing/leading whitespace-like artifacts (defensive)
  variants.add(slug.trim());

  variants.delete(slug); // skip the original
  return [...variants];
}

async function findFix(slug) {
  const variants = generateVariations(slug);
  const results = await Promise.all(variants.map((v) => head(v)));
  const hit = results.find((r) => r.ok);
  return hit ? hit.slug : null;
}

async function main() {
  console.log(`Auditing ${ugcManifest.length} clips against Cloudinary...\n`);

  const results = await Promise.all(ugcManifest.map((c) => head(c.slug)));

  const works = results.filter((r) => r.ok);
  const broken = results.filter((r) => !r.ok);

  console.log(`WORKS: ${works.length}/${ugcManifest.length}`);
  console.log(`404:   ${broken.length}/${ugcManifest.length}\n`);

  if (broken.length === 0) {
    console.log('All slugs resolve. Nothing to fix.');
    return;
  }

  console.log('Broken slugs — trying variations:\n');
  for (const b of broken) {
    const fix = await findFix(b.slug);
    if (fix) {
      console.log(`  [FIX]  ${b.slug}`);
      console.log(`       → ${fix}`);
    } else {
      console.log(`  [???]  ${b.slug}  (no variation worked)`);
    }
  }

  const unfixable = [];
  const fixes = [];
  for (const b of broken) {
    const fix = await findFix(b.slug);
    if (fix) fixes.push({from: b.slug, to: fix});
    else unfixable.push(b.slug);
  }

  console.log(`\nSummary: ${fixes.length} auto-fixable, ${unfixable.length} need manual lookup.`);
  if (unfixable.length) {
    console.log('\nUnfixable (paste Cloudinary filenames for these):');
    unfixable.forEach((s) => console.log(`  - ${s}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
