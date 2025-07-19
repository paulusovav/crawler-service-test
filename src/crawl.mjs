import "dotenv/config";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import fs from "fs/promises";
import path from "path";
import { slugifyPath, writeMarkdown, getMarkdownPath } from "./filesystem.js";
import { fetchFirecrawl, HttpError, TimeoutError, RateLimitError, ParseError } from "./firecrawl.js";
import { upsertPage } from "./notion.js";
import { validateURL, CrawlerError } from "./utils.js";
import { uploadMarkdownToGitHub } from "./github.js";
import { getUrlsFromSitemap, extractLinksFromHtml } from "./discovery.js";
import fetch from "node-fetch";
import { Octokit } from "@octokit/core";

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
  .option("deep", {
    type: "boolean",
    describe: "Automaticky najde a stáhne všechny podstránky (deep crawl)",
    default: false
  })
  .option("max-depth", {
    type: "number",
    describe: "Maximální hloubka pro deep crawl",
    default: 3
  })
  .option("update", {
    type: "boolean",
    describe: "Aktualizovat existující web (re-crawl, update Notion, přepsat GitHub)",
    default: false
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

// Deep crawling logika
async function discoverAllUrls(startUrl, maxDepth) {
  const seen = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  const discovered = [];
  const baseDomain = new URL(startUrl).hostname;
  let sitemapUrls = await getUrlsFromSitemap(startUrl);
  if (sitemapUrls.length > 0) {
    // Použij sitemapu
    for (const u of sitemapUrls) {
      try {
        const urlObj = new URL(u);
        if (urlObj.hostname === baseDomain) {
          seen.add(urlObj.href);
          discovered.push(urlObj.href);
        }
      } catch {}
    }
    console.log(`Sitemap: nalezeno ${discovered.length} URL.`);
    return discovered;
  }
  // Fallback: link discovery z homepage
  console.log("Sitemap nenalezena nebo prázdná, spouštím link discovery...");
  while (queue.length > 0) {
    const { url, depth } = queue.shift();
    if (depth > maxDepth) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    discovered.push(url);
    try {
      const res = await fetch(url, { timeout: 15000 });
      if (!res.ok) continue;
      const html = await res.text();
      const links = extractLinksFromHtml(html, url);
      for (const link of links) {
        if (!seen.has(link)) {
          const linkDomain = new URL(link).hostname;
          if (linkDomain === baseDomain) {
            queue.push({ url: link, depth: depth + 1 });
          }
        }
      }
    } catch (err) {
      // ignoruj chyby jednotlivých stránek
    }
    // Progress reporting
    if (discovered.length % 10 === 0) {
      console.log(`Crawled ${discovered.length} stránek... fronta: ${queue.length}`);
    }
  }
  return discovered;
}

// Pomocná funkce: získá seznam všech markdown souborů ve složce na GitHubu
async function listGithubFiles({ owner, repo, path, token, branch = "main" }) {
  const octokit = new Octokit({ auth: token });
  try {
    const res = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref: branch
    });
    if (Array.isArray(res.data)) {
      return res.data.filter(f => f.name.endsWith('.md')).map(f => f.path);
    }
    return [];
  } catch (err) {
    // Pokud složka neexistuje, vrátí prázdné pole
    return [];
  }
}

// Pomocná funkce: smaže soubor na GitHubu
async function deleteGithubFile({ owner, repo, path, token, branch = "main" }) {
  const octokit = new Octokit({ auth: token });
  // Získat SHA souboru
  const res = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path,
    ref: branch
  });
  const sha = res.data.sha;
  await octokit.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path,
    message: `Delete ${path}`,
    sha,
    branch
  });
}

// Hlavní orchestrátor
async function main() {
  let urls = await loadUrls();
  const isDeep = argv.deep;
  const isUpdate = argv.update;
  let deepDomains = [];
  if (isDeep) {
    // Deep crawl pro každý zadaný root URL
    let allDiscovered = [];
    for (const root of urls) {
      const found = await discoverAllUrls(root, argv["max-depth"]);
      allDiscovered = allDiscovered.concat(found);
      deepDomains.push({ root, found });
    }
    // Deduplication
    urls = Array.from(new Set(allDiscovered));
    console.log(`Celkem ke stažení: ${urls.length} URL.`);
  }
  const results = [];
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "2357149d88d080b4a9c7c6d4e59e8c85";
  const GITHUB_REPO_URL = process.env.GITHUB_REPO_URL;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!FIRECRAWL_API_KEY || !NOTION_API_KEY || !GITHUB_REPO_URL || !GITHUB_TOKEN) {
    console.error("❌ Chybí potřebné proměnné v .env");
    process.exit(1);
  }
  // Získání owner a repo z GITHUB_REPO_URL
  const match = GITHUB_REPO_URL.match(/github.com\/(.+?)\/(.+?)(?:$|\/)/);
  if (!match) {
    console.error("❌ GITHUB_REPO_URL není ve správném formátu");
    process.exit(1);
  }
  const owner = match[1];
  const repo = match[2];

  if (isDeep) {
    for (const { root, found } of deepDomains) {
      const u = new URL(root);
      const host = u.hostname;
      let homepageTitle = host;
      try {
        const res = await fetch(root, { timeout: 15000 });
        if (res.ok) {
          const html = await res.text();
          const m = html.match(/<title>(.*?)<\/title>/i);
          if (m) homepageTitle = m[1];
        }
      } catch {}
      const folderLink = `${GITHUB_REPO_URL}/tree/main/content/${host}`;
      const status = `OK (${found.length} pages crawled)`;
      // --- UPDATE režim ---
      if (isUpdate) {
        // 1. Získat existující markdown soubory na GitHubu
        const existingFiles = await listGithubFiles({ owner, repo, path: `content/${host}`, token: GITHUB_TOKEN });
        // 2. Vytvořit set nových cest
        const newFiles = new Set(found.map(url => {
          const slug = slugifyPath(url);
          return `content/${host}/${slug}.md`;
        }));
        // 3. Smazat soubory, které už na webu nejsou
        for (const file of existingFiles) {
          if (!newFiles.has(file)) {
            await deleteGithubFile({ owner, repo, path: file, token: GITHUB_TOKEN });
            console.log(`Smazán soubor na GitHubu: ${file}`);
          }
        }
      }
      // --- Upload všech stránek (přepíše existující) ---
      for (const url of found) {
        try {
          validateURL(url);
          const data = await fetchFirecrawl(url, FIRECRAWL_API_KEY);
          const slug = slugifyPath(url);
          const githubPath = getMarkdownPath(host, slug);
          await uploadMarkdownToGitHub({
            owner,
            repo,
            path: githubPath,
            content: data.data.markdown,
            token: GITHUB_TOKEN
          });
        } catch (err) {
          console.error(err.message);
        }
      }
      // --- Update Notion záznamu ---
      await upsertPage({
        notionApiKey: NOTION_API_KEY,
        databaseId: NOTION_DATABASE_ID,
        url: root,
        title: homepageTitle,
        crawledAt: new Date().toISOString(),
        markdownLink: folderLink,
        status,
        domainMode: true,
        domainName: host
      });
      results.push({ url: root, status, file: `content/${host}/` });
    }
  } else {
    // Single page režim (původní chování)
    for (const url of urls) {
      let status = "OK";
      let filePath = null;
      let title = "";
      let markdownLink = "";
      try {
        validateURL(url);
        const data = await fetchFirecrawl(url, FIRECRAWL_API_KEY);
        title = data.data.metadata?.title || data.title || url;
        const u = new URL(url);
        const host = u.hostname;
        const slug = slugifyPath(url);
        const githubPath = getMarkdownPath(host, slug);
        markdownLink = await uploadMarkdownToGitHub({
          owner,
          repo,
          path: githubPath,
          content: data.data.markdown,
          token: GITHUB_TOKEN
        });
        filePath = githubPath;
        markdownLink = `${GITHUB_REPO_URL}/raw/main/${filePath}`;
        await upsertPage({
          notionApiKey: NOTION_API_KEY,
          databaseId: NOTION_DATABASE_ID,
          url,
          title,
          crawledAt: new Date().toISOString(),
          markdownLink,
          status: "OK"
        });
        results.push({ url, status: "OK", file: filePath });
      } catch (err) {
        if (err instanceof HttpError && (err.status === 404 || err.status === 410)) {
          status = "Dead link";
        } else if (err instanceof CrawlerError) {
          status = "Error";
        } else {
          status = "Error";
        }
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
  }
  // Výpis souhrnné tabulky
  console.log("\nSouhrn:");
  console.table(results);
}

main(); 
