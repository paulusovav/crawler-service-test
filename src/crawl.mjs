// Funkce pro převod URL na bezpečný název souboru/slug
// Používá se pro pojmenování markdown souborů podle cesty v URL
export function slugifyPath(url) {
  try {
    const u = new URL(url);
    if (u.pathname === "/") return "_index";
    return u.pathname
      .replace(/\/$/, "")        // odstraní koncové lomítko
      .replace(/^\//, "")        // odstraní počáteční lomítko
      .replace(/[/?&=]+/g, "-")   // nahradí speciální znaky pomlčkou
      .toLowerCase();
  } catch (err) {
    // Pokud URL není validní, vyhodí chybu dál
    throw new Error(`slugifyPath: Neplatná URL: ${url}`);
  }
}

import fs from "fs/promises";
import path from "path";

// Vlastní chybová třída pro chyby zápisu na disk
export class FsError extends Error {
  constructor(message) {
    super(message);
    this.name = "FsError";
  }
}

// Funkce pro zápis markdown obsahu do správné složky a souboru
// baseDir: např. "content", host: např. "example.com", slug: např. "about"
export async function writeMarkdown(baseDir, host, slug, content) {
    console.log('=== FILESYSTEM DEBUG ===');
  console.log('baseDir:', baseDir);
  console.log('host:', host);
  console.log('slug:', slug);
  console.log('content type:', typeof content);
  console.log('content length:', content ? content.length : 'undefined');
  console.log('=======================');
  try {
    const dir = path.join(baseDir, host);
    await fs.mkdir(dir, { recursive: true }); // Vytvoří složku pokud neexistuje
    const filePath = path.join(dir, `${slug}.md`);
    await fs.writeFile(filePath, content, "utf8");
    return filePath;
  } catch (err) {
    throw new FsError(`💾 Cannot write file ${host}/${slug}.md: ${err.message}`);
  }
}

// Pomocná funkce pro sestavení cesty v repozitáři
export function getMarkdownPath(host, slug) {
  return `content/${host}/${slug}.md`;
} 
