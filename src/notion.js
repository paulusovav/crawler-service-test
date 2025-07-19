import { Client } from "@notionhq/client";
import { CrawlerError } from "./utils.js";

export class NotionError extends CrawlerError {
  constructor(message) {
    super(`🚫 Notion update failed: ${message}`);
    this.name = "NotionError";
  }
}

export async function upsertPage({ notionApiKey, databaseId, url, title, crawledAt, markdownLink, status }) {
  const notion = new Client({ auth: notionApiKey });
  
  try {
    const properties = {};
    
    properties["Title"] = {
      "title": [
        {
          "text": {
            "content": title || "Untitled Page"
          }
        }
      ]
    };
    
    if (url) {
      properties["URL"] = {
        "url": url
      };
    }
    
    if (crawledAt) {
      properties["Crawled At"] = {
        "date": {
          "start": crawledAt
        }
      };
    }

    if (markdownLink) {
      properties["Markdown link"] = {
        "url": markdownLink
      };
    }
    
    properties["Status"] = {
      "select": {
        "name": status || "OK"
      }
    };
    
    await notion.pages.create({
      parent: { 
        database_id: databaseId 
      },
      properties: properties
    });
    
    console.log(`✓ Notion: Created page for ${url}`);
  } catch (err) {
    console.log('✗ Notion detailed error:', err);
    throw new NotionError(err.message);
  }
}
