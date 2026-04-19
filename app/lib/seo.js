/**
 * Build a consistent set of meta tags for a route.
 *
 * @param {{
 *   title: string;
 *   description?: string;
 *   url?: string;
 *   type?: string;
 *   image?: string;
 * }} opts
 */
export function createSeoMeta({
  title,
  description,
  url,
  type = 'website',
  image,
}) {
  const tags = [
    {title},
    {property: 'og:title', content: title},
    {property: 'og:type', content: type},
    {property: 'og:site_name', content: 'PetYupp'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
  ];
  if (description) {
    tags.push(
      {name: 'description', content: description},
      {property: 'og:description', content: description},
      {name: 'twitter:description', content: description},
    );
  }
  if (url) {
    tags.push(
      {tagName: 'link', rel: 'canonical', href: url},
      {property: 'og:url', content: url},
    );
  }
  if (image) {
    tags.push(
      {property: 'og:image', content: image},
      {name: 'twitter:image', content: image},
    );
  }
  return tags;
}

/**
 * Strip HTML and truncate to ~160 chars for meta description.
 * @param {string|null|undefined} html
 */
export function excerpt(html, length = 160) {
  if (!html) return '';
  const text = String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= length) return text;
  return text.slice(0, length - 1).trimEnd() + '…';
}

export const SITE_URL = 'https://petyupp.com';
