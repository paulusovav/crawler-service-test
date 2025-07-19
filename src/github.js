import fetch from "node-fetch";
import { CrawlerError } from "./utils.js";

// Chyba pro GitHub API
export class GitHubError extends CrawlerError {
  constructor(message) {
    super(`🐙 GitHub upload failed: ${message}`);
    this.name = "GitHubError";
  }
}

/**
 * Nahraje markdown soubor do GitHub repozitáře (vytvoří nebo aktualizuje soubor)
 * @param {Object} params
 * @param {string} params.owner - GitHub uživatel/organizace
 * @param {string} params.repo - Název repozitáře
 * @param {string} params.path - Cesta k souboru v repozitáři (např. content/example.com/about.md)
 * @param {string} params.content - Markdown obsah
 * @param {string} params.token - GitHub Personal Access Token
 * @param {string} [params.branch=main] - Větev (default main)
 * @returns {Promise<string>} - Raw URL na nahraný soubor
 */
export async function uploadMarkdownToGitHub({ owner, repo, path, content, token, branch = "main" }) {
  try {
    // Zjisti, zda soubor už existuje (kvůli SHA pro update)
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    let sha = null;
    let method = "PUT";
    let body = {
      message: `Update ${path}`,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch
    };
    // Zkus načíst existující soubor
    const getRes = await fetch(`${apiBase}?ref=${branch}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
      body.sha = sha;
    }
    // Nahrání (vytvoření nebo update)
    const res = await fetch(apiBase, {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new GitHubError(`HTTP ${res.status}: ${errText}`);
    }
    const data = await res.json();
    // Sestav raw URL
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    return rawUrl;
  } catch (err) {
    if (err instanceof GitHubError) throw err;
    throw new GitHubError(err.message);
  }
} 
