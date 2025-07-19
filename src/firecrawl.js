import fetch from "node-fetch";
import pThrottle from "p-throttle";
import { CrawlerError } from "./utils.js";

// Chyby specifické pro Firecrawl
export class HttpError extends CrawlerError {
  constructor(status, url) {
    super(`⚠️ ${status} ${HttpError.statusText(status)} – ${url}`);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
  }
  static statusText(status) {
    if (status === 404) return "Not Found";
    if (status === 410) return "Gone";
    if (status >= 500 && status < 600) return "Bad Gateway";
    return "HTTP Error";
  }
}

export class TimeoutError extends CrawlerError {
  constructor(url) {
    super(`⏱️ Request timed‑out after 30 s – ${url}`);
    this.name = "TimeoutError";
  }
}

export class RateLimitError extends CrawlerError {
  constructor(url) {
    super(`⏳ Too many requests (Firecrawl 429). Retrying…`);
    this.name = "RateLimitError";
    this.url = url;
  }
}

export class ParseError extends CrawlerError {
  constructor(url) {
    super(`💥 Invalid Firecrawl JSON for ${url}`);
    this.name = "ParseError";
  }
}

// Throttle: max 1 požadavek za 0.5 s
const throttle = pThrottle({ limit: 1, interval: 500 });

// Wrapper pro volání Firecrawl API s retry a timeoutem
export async function fetchFirecrawl(url, apiKey, maxRetries = 5) {
  let attempt = 0;
  let delay = 1000; // počáteční delay pro backoff
  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      const res = await throttle(() => fetch("https://api.firecrawl.dev/v0/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url, clean_html: true }),
        signal: controller.signal
      }))();
      clearTimeout(timeout);
      if (res.status === 429) {
        // Rate limit: exponenciální backoff
        attempt++;
        if (attempt > maxRetries) throw new RateLimitError(url);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      if (res.status === 404 || res.status === 410) {
        throw new HttpError(res.status, url);
      }
      if (res.status >= 500 && res.status < 600) {
        throw new HttpError(res.status, url);
      }
      if (!res.ok) {
        throw new HttpError(res.status, url);
      }
      let data;
      try {
        data = await res.json();
      } catch {
        throw new ParseError(url);
      }
      console.log('=== FIRECRAWL DEBUG ===');
      console.log('Response status:', res.status);
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('====================');
      return data;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new TimeoutError(url);
      }
      if (err instanceof CrawlerError) throw err;
      // Ostatní chyby (síť, fetch, atd.)
      if (attempt >= maxRetries) throw new CrawlerError(`Firecrawl failed after ${maxRetries} attempts: ${err.message}`);
      attempt++;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
} 
