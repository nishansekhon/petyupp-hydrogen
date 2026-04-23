#!/usr/bin/env node
/**
 * Reconcile productHandle values in app/lib/ugcManifest.js against the
 * list of real Shopify product handles pulled by pull-shopify-handles.mjs.
 *
 * Report:
 *   MATCHED     — manifest handles that exist in Shopify
 *   MISMATCHED  — manifest handles that don't; with closest-title suggestion
 *   UNUSED      — Shopify handles with no UGC clips mapped yet
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const shopifyPath = resolve(__dirname, 'shopify-handles.json');
const manifestPath = resolve(REPO_ROOT, 'app/lib/ugcManifest.js');

const shopifyProducts = JSON.parse(readFileSync(shopifyPath, 'utf8'));
const shopifyByHandle = new Map(shopifyProducts.map((p) => [p.handle, p]));

const { ugcManifest } = await import(pathToFileURL(manifestPath).href);

const manifestHandles = [...new Set(ugcManifest.map((c) => c.productHandle).filter(Boolean))];
const manifestHandleClipCounts = new Map();
for (const clip of ugcManifest) {
  if (!clip.productHandle) continue;
  manifestHandleClipCounts.set(
    clip.productHandle,
    (manifestHandleClipCounts.get(clip.productHandle) || 0) + 1,
  );
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function suggestClosest(manifestHandle) {
  const needle = manifestHandle;
  const needleTokens = needle.split('-').filter(Boolean);

  const candidates = shopifyProducts.map((p) => {
    const titleNorm = normalize(p.title);
    const handleDist = levenshtein(needle, p.handle);
    const titleDist = levenshtein(needle, titleNorm);

    const overlap = needleTokens.filter(
      (t) => t.length >= 3 && (p.handle.includes(t) || titleNorm.includes(t)),
    ).length;

    const combined = Math.min(handleDist, titleDist) - overlap * 3;
    return { product: p, combined, handleDist, titleDist, overlap };
  });

  candidates.sort((a, b) => a.combined - b.combined);
  return candidates.slice(0, 3);
}

const matched = [];
const mismatched = [];

for (const handle of manifestHandles) {
  if (shopifyByHandle.has(handle)) {
    matched.push(handle);
  } else {
    mismatched.push(handle);
  }
}

const manifestHandleSet = new Set(manifestHandles);
const unused = shopifyProducts
  .filter((p) => !manifestHandleSet.has(p.handle))
  .map((p) => p.handle);

function line(ch = '=', n = 72) {
  return ch.repeat(n);
}

console.log(line('='));
console.log('UGC MANIFEST ↔ SHOPIFY HANDLE RECONCILIATION');
console.log(line('='));
console.log(`Shopify products:       ${shopifyProducts.length}`);
console.log(`Unique manifest handles: ${manifestHandles.length}`);
console.log(`Total manifest clips:    ${ugcManifest.length}`);
console.log('');

console.log(line('-'));
console.log(`MATCHED (${matched.length})`);
console.log(line('-'));
if (matched.length === 0) {
  console.log('  (none)');
} else {
  for (const h of matched.sort()) {
    const clips = manifestHandleClipCounts.get(h);
    const p = shopifyByHandle.get(h);
    console.log(`  ✓ ${h.padEnd(40)} ${clips} clip${clips === 1 ? '' : 's'}   → ${p.title}`);
  }
}
console.log('');

console.log(line('-'));
console.log(`MISMATCHED (${mismatched.length})`);
console.log(line('-'));
if (mismatched.length === 0) {
  console.log('  (none) — all manifest handles exist in Shopify');
} else {
  for (const h of mismatched.sort()) {
    const clips = manifestHandleClipCounts.get(h);
    console.log(`  ✗ ${h}  (${clips} clip${clips === 1 ? '' : 's'})`);
    const suggestions = suggestClosest(h);
    for (const s of suggestions) {
      console.log(`      → ${s.product.handle.padEnd(40)} "${s.product.title}"`);
    }
    console.log('');
  }
}

console.log(line('-'));
console.log(`UNUSED — Shopify handles with no UGC clips (${unused.length})`);
console.log(line('-'));
if (unused.length === 0) {
  console.log('  (none) — every Shopify product has at least one clip');
} else {
  for (const h of unused.sort()) {
    const p = shopifyByHandle.get(h);
    console.log(`  ○ ${h.padEnd(40)} "${p.title}"`);
  }
}
console.log('');
console.log(line('='));
console.log(`Summary: ${matched.length} matched, ${mismatched.length} mismatched, ${unused.length} unused`);
console.log(line('='));
