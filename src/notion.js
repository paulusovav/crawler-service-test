import { Client } from "@notionhq/client";
import { CrawlerError } from "./utils.js";

export class NotionError extends CrawlerError {
  constructor(message) {
    super(`🚫 Notion update failed: ${message}`);
    this.name = "NotionError";
  }
}

/**
 * Upsert záznamu v Notion – podle URL (single page) nebo podle domény (deep crawl)
 * @param {Object} params
 * @param {boolean} [params.domainMode] - Pokud true, hledá podle domény (Title)
 * @param {string} [params.domainName] - Název domény (např. example.com)
 */
export async function upsertPage({ notionApiKey, databaseId, url, title, crawledAt, markdownLink, status, domainMode = false, domainName = "" }) {
  const notion = new Client({ auth: notionApiKey });
  try {
    const properties = {};
    properties["Title"] = {
      "title": [
        {
          "text": {
            "content": title || domainName || "Untitled Page"
          }
        }
      ]
    };
    if (!domainMode && url) {
      properties["URL"] = { "url": url };
    } else if (domainMode && url) {
      properties["URL"] = { "url": url };
    }
    if (crawledAt) {
      properties["Crawled At"] = {
        "date": { "start": crawledAt }
      };
    }
    if (markdownLink) {
      properties["Markdown link"] = { "url": markdownLink };
    }
    properties["Status"] = {
      "select": { "name": status || "OK" }
    };
    // Upsert logika
    let search;
    if (domainMode && domainName) {
      search = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: "Title",
          title: { equals: domainName }
        }
      });
    } else {
      search = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: "URL",
          url: { equals: url }
        }
      });
    }
    if (search.results.length > 0) {
      await notion.pages.update({
        page_id: search.results[0].id,
        properties
      });
    } else {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties
      });
    }
    console.log(`✓ Notion: Upsert pro ${domainMode ? domainName : url}`);
  } catch (err) {
    console.log('✗ Notion detailed error:', err);
    throw new NotionError(err.message);
  }
}
