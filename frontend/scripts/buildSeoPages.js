import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANSDOWNE_HERO_IMAGE, LANSDOWNE_SEO_BASE_URL, LANSDOWNE_SEO_PAGES } from '../src/data/lansdowneSeoPages.js';
import { DESTINATION_PAGES } from '../src/data/destinationPages.js';
import { POLICY_PAGES } from '../src/data/policyPages.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const distributionDirectory = path.resolve(scriptDirectory, '..', 'dist');
const template = await readFile(path.join(distributionDirectory, 'index.html'), 'utf8');

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const writeStaticPage = async ({ slug, title, description, bodyHtml }) => {
  const canonicalUrl = `${LANSDOWNE_SEO_BASE_URL}/${slug}/`;
  const metadata = [
    `<link rel="canonical" href="${canonicalUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  ];
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonicalUrl,
    inLanguage: 'en-IN'
  }).replaceAll('<', '\\u003c');
  metadata.push(`<script type="application/ld+json">${structuredData}</script>`);
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace('</head>', `    ${metadata.join('\n    ')}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  const pageDirectory = path.join(distributionDirectory, slug);
  await mkdir(pageDirectory, { recursive: true });
  await writeFile(path.join(pageDirectory, 'index.html'), html);
};

for (const page of LANSDOWNE_SEO_PAGES) {
  const relatedLinks = LANSDOWNE_SEO_PAGES
    .filter((relatedPage) => relatedPage.slug !== page.slug)
    .map((relatedPage) => `<li><a href="/${relatedPage.slug}/">${escapeHtml(relatedPage.title.split('|')[0].trim())}</a></li>`)
    .join('');
  await writeStaticPage({
    slug: page.slug,
    title: page.title,
    description: page.description,
    bodyHtml: `<main>
    <img src="${LANSDOWNE_HERO_IMAGE}" alt="Illustrative hill resort scenery" width="1600" height="900" style="width:100%;height:280px;object-fit:cover" />
    <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Lansdowne</span></nav>
    <h1>${escapeHtml(page.title.split('|')[0].trim())}</h1>
    <p>${escapeHtml(page.intro)}</p>
    <p>${escapeHtml(page.highlight)}</p>
    <h2>Available stays in Lansdowne</h2>
    <p>Compare property location, room details, amenities and final prices for your travel dates before booking.</p>
    <nav aria-label="More Lansdowne hotel searches"><h2>Explore more Lansdowne hotel searches</h2><ul>${relatedLinks}</ul></nav>
  </main>`,
  });
}

for (const page of DESTINATION_PAGES) {
  await writeStaticPage({
    slug: page.slug,
    title: `${page.title} | TRUMITRIP`,
    description: page.description,
    bodyHtml: `<main>
    <img src="${page.heroImage}" alt="${escapeHtml(page.title)}" width="1600" height="900" style="width:100%;height:280px;object-fit:cover" />
    <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>${escapeHtml(page.city)}</span></nav>
    <h1>${escapeHtml(page.title)}</h1>
    <p>${escapeHtml(page.intro)}</p>
    <p>${escapeHtml(page.highlight)}</p>
    <h2>Available stays in ${escapeHtml(page.city)}</h2>
    <p><a href="/">Search hotels on TRUMITRIP</a></p>
  </main>`,
  });
}

for (const page of POLICY_PAGES) {
  await writeStaticPage({
    slug: page.slug,
    title: `${page.title} | TRUMITRIP`,
    description: page.subtitle,
    bodyHtml: `<main>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>${escapeHtml(page.title)}</span></nav>
    <h1>${escapeHtml(page.title)}</h1>
    <p>${escapeHtml(page.subtitle)}</p>
    <p><a href="/">Return to TRUMITRIP home</a></p>
  </main>`,
  });
}

const sitemapUrls = [
  LANSDOWNE_SEO_BASE_URL,
  ...LANSDOWNE_SEO_PAGES.map((page) => `${LANSDOWNE_SEO_BASE_URL}/${page.slug}/`),
  ...DESTINATION_PAGES.map((page) => `${LANSDOWNE_SEO_BASE_URL}/${page.slug}/`),
  ...POLICY_PAGES.map((page) => `${LANSDOWNE_SEO_BASE_URL}/${page.slug}/`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(distributionDirectory, 'sitemap.xml'), sitemap);
await writeFile(
  path.join(distributionDirectory, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${LANSDOWNE_SEO_BASE_URL}/sitemap.xml\n`
);

console.log(`Generated ${LANSDOWNE_SEO_PAGES.length} Lansdowne, ${DESTINATION_PAGES.length} destination, and ${POLICY_PAGES.length} policy pages.`);
