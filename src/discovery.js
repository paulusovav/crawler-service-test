import fetch from "node-fetch";
import { CrawlerError } from "./utils.js";

// Chyba pro discovery fázi
export class DiscoveryError extends CrawlerError {
  constructor(message) {
    super(`🔎 Discovery error: ${message}`);
    this.name = "DiscoveryError";
  }
}

// Pomocná funkce pro rozpoznání, zda URL je sitemap (xml)
function isSitemapUrl(url) {
  return url.endsWith(".xml") || url.includes("sitemap");
}

// Pomocná funkce pro rozpoznání, zda URL je HTML stránka
function isHtmlUrl(url) {
  return url.match(/\.(html?|php|asp|aspx)?([?#].*)?$/i) || !url.match(/\.(xml|pdf|jpg|jpeg|png|gif|svg|webp|ico|js|css|json|csv|zip|gz|mp3|mp4|avi|mov|wmv|doc|docx|xls|xlsx|ppt|pptx|rss|atom)([?#].*)?$/i);
}

// Rekurzivně projde sitemap.xml a sitemap indexy, vrátí pole HTML URL
export async function getUrlsFromSitemap(url, _visited = new Set()) {
  try {
    const u = new URL(url);
    const sitemapUrl = url.endsWith(".xml") ? url : `${u.origin}/sitemap.xml`;
    if (_visited.has(sitemapUrl)) return [];
    _visited.add(sitemapUrl);
    const res = await fetch(sitemapUrl, { timeout: 15000 });
    if (!res.ok) return [];
    const xml = await res.text();
    // Najdi všechny <loc> tagy
    const locs = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map(m => m[1]);
    let htmlUrls = [];
    for (const loc of locs) {
      if (isSitemapUrl(loc) && !loc.endsWith('.html')) {
        // Rekurzivně projdi další sitemapu
        const subUrls = await getUrlsFromSitemap(loc, _visited);
        htmlUrls = htmlUrls.concat(subUrls);
      } else if (isHtmlUrl(loc)) {
        htmlUrls.push(loc);
      }
    }
    // Deduplication
    return Array.from(new Set(htmlUrls));
  } catch (err) {
    return [];
  }
}

// Extrahuje všechny odkazy z HTML (jen stejné domény, absolutní i relativní)
export function extractLinksFromHtml(html, baseUrl) {
  try {
    const base = new URL(baseUrl);
    const links = Array.from(html.matchAll(/<a\s+[^>]*href=["']([^"'#?]+)["']/gi))
      .map(m => m[1])
      .map(href => {
        try {
          return new URL(href, base).href;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter(href => {
        try {
          const u = new URL(href);
          return u.hostname === base.hostname;
        } catch {
          return false;
        }
      });
    return Array.from(new Set(links));
  } catch (err) {
    throw new DiscoveryError("HTML link extraction failed");
  }
} 
