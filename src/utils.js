// Základní třída pro všechny crawler chyby
export class CrawlerError extends Error {
  constructor(message) {
    super(message);
    this.name = "CrawlerError";
  }
}

// Chyba pro neplatné URL
export class InvalidUrlError extends CrawlerError {
  constructor(url) {
    super(`❌ Invalid URL format: "${url}" – skipping.`);
    this.name = "InvalidUrlError";
  }
}

// Validace URL (vrací true/false nebo vyhazuje InvalidUrlError)
export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    throw new InvalidUrlError(url);
  }
} 
