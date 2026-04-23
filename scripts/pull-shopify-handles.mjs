#!/usr/bin/env node
/**
 * Pull all product handles from the PetYupp Shopify Storefront API.
 * Output: scripts/shopify-handles.json
 *
 * Reads PUBLIC_STORE_DOMAIN and PUBLIC_STOREFRONT_API_TOKEN from .env.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

function loadEnv() {
  const raw = readFileSync(resolve(REPO_ROOT, '.env'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();
const DOMAIN = env.PUBLIC_STORE_DOMAIN;
const TOKEN = env.PUBLIC_STOREFRONT_API_TOKEN;

if (!DOMAIN || !TOKEN) {
  console.error('Missing PUBLIC_STORE_DOMAIN or PUBLIC_STOREFRONT_API_TOKEN in .env');
  process.exit(1);
}

const API_URL = `https://${DOMAIN}/api/2024-10/graphql.json`;

const QUERY = `
  query AllProducts($cursor: String) {
    products(first: 100, after: $cursor) {
      edges {
        node {
          id
          handle
          title
          productType
          options { name values }
        }
        cursor
      }
      pageInfo { hasNextPage }
    }
  }
`;

async function fetchPage(cursor) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query: QUERY, variables: { cursor } }),
  });
  if (!res.ok) {
    throw new Error(`Storefront API ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data.products;
}

async function main() {
  console.log(`Fetching products from ${DOMAIN}...`);
  const all = [];
  let cursor = null;

  while (true) {
    const page = await fetchPage(cursor);
    for (const { node } of page.edges) {
      all.push({
        handle: node.handle,
        title: node.title,
        productType: node.productType,
        options: node.options,
      });
    }
    if (!page.pageInfo.hasNextPage) break;
    cursor = page.edges[page.edges.length - 1].cursor;
    console.log(`  fetched ${all.length} so far, continuing...`);
  }

  const outPath = resolve(__dirname, 'shopify-handles.json');
  writeFileSync(outPath, JSON.stringify(all, null, 2) + '\n');
  console.log(`Wrote ${all.length} products to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
