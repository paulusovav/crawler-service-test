import "dotenv/config";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import fs from "fs/promises";
import path from "path";
import { slugifyPath, writeMarkdown } from "./filesystem.js";
import { fetchFirecrawl, HttpError, TimeoutError, RateLimitError, ParseError } from "./firecrawl.js";
import { upsertPage } from "./notion.js";
import { validateURL, CrawlerError } from "./utils.js";

// CLI argumenty
export const argv = yargs(hideBin(process.argv))
  .option("urls", {
    type: "string",
    describe: "Čárkami oddělený seznam URL",
  })
  .option("file", {
    type: "string",
    describe: "Cesta k souboru urls.txt",
  })
  .check((argv) => {
    if (!argv.urls && !argv.file) {
      throw new Error("Provide --urls or --file");
    }
    return true;
  })
  .parse();

// Načtení URL ze vstupu
async function loadUrls() {
  if (argv.urls) {
    return argv.urls.split(",").map(u => u.trim()).filter(Boolean);
  }
  if (argv.file) {
    const content = await fs.readFile(argv.file, "utf8");
    return content.split(/\r?\n/).map(u => u.trim()).filter(Boolean);
  }
  return [];
}

// Hlavní orchestrátor
async function main() {
  const urls = await loadUrls();
  const results = [];
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "2357149d88d080b4a9c7c6d4e59e8c85";
  const GITHUB_REPO_URL = process.env.GITHUB_REPO_URL;
  if (!FIRECRAWL_API_KEY || !NOTION_API_KEY || !GITHUB_REPO_URL) {
    console.error("❌ Chybí potřebné proměnné v .env");
    process.exit(1);
  }
  for (const url of urls) {
    let status = "OK";
    let filePath = null;
    let title = "";
    let markdownLink = "";
    try {
      validateURL(url);
      // 1. Stáhni obsah přes Firecrawl
      const data = await fetchFirecrawl(url, FIRECRAWL_API_KEY);
      title = data.data.metadata?.title || data.title || url;
      // 2. Ulož markdown do content/
      const u = new URL(url);
      const host = u.hostname;
      const slug = slugifyPath(url);
      filePath = await writeMarkdown("content", host, slug, data.data.markdown);
      // 3. Markdown link (raw GitHub URL)
      markdownLink = `${GITHUB_REPO_URL}/raw/main/${filePath}`;
      // 4. Zapiš do Notion
      await upsertPage({
        notionApiKey: NOTION_API_KEY,
        databaseId: NOTION_DATABASE_ID,
        url,
        title,
        crawledAt: new Date().toISOString(),
        markdownLink,
        status: "OK"
      });
      // 5. Přidej do výsledků
      results.push({ url, status: "OK", file: filePath });
    } catch (err) {
      if (err instanceof HttpError && (err.status === 404 || err.status === 410)) {
        status = "Dead link";
      } else if (err instanceof CrawlerError) {
        status = "Error";
      } else {
        status = "Error";
      }
      // Pokus o zápis do Notion i při chybě
      try {
        await upsertPage({
          notionApiKey: NOTION_API_KEY,
          databaseId: NOTION_DATABASE_ID,
          url,
          title: title || url,
          crawledAt: new Date().toISOString(),
          markdownLink: markdownLink || "",
          status
        });
      } catch (notionErr) {
        console.error(notionErr.message);
      }
      results.push({ url, status, file: filePath });
      console.error(err.message);
    }
  }
  // Výpis souhrnné tabulky
  console.log("\nSouhrn:");
  console.table(results);
}

main(); 
