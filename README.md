# 🕸️ Web Crawler MVP

Automatický crawler pro stahování webových stránek do Markdown formátu s ukládáním na GitHub a správou metadat v Notion.

## ✨ Co umí:
- Stahuje obsah webových stránek přes Firecrawl API
- Převádí na čistý Markdown
- Automaticky nahrává na GitHub
- Zapisuje metadata do Notion databáze
- Podporuje batch zpracování více URL

---

## 📋 Návod pro spuštění: Jak spustit web crawler

### 🎯 **Co potřebuješ:**
- Node.js na svém počítači
- GitHub účet
- Notion účet  
- Firecrawl účet

---

### **KROK 1: Stáhni si kód**
1. **Jdi na** https://github.com/paulusovav/crawler-service-test
2. **Klikni zelené tlačítko "Code"**
3. **"Download ZIP"**
4. **Rozbal** ZIP soubor na svém počítači

### **KROK 2: Otevři projekt**
1. **Otevři složku** s rozbalenými soubory
2. **Otevři ji v editoru** (VS Code, Cursor, atd.)

### **KROK 3: Nainstaluj balíčky**
1. **Otevři terminál** v editoru (Ctrl+`)
2. **Napiš:** `npm install`
3. **Stiskni Enter** a počkej

### **KROK 4: Vytvoř si Firecrawl účet**
1. **Jdi na** https://firecrawl.dev
2. **Zaregistruj se**
3. **Zkopíruj API klíč**

### **KROK 5: Vytvoř si GitHub token**
1. **GitHub.com** → Settings → Developer settings
2. **Personal access tokens** → **Tokens (classic)**
3. **Generate new token**
4. **Zaškrtni "repo"**
5. **Zkopíruj token**

### **KROK 6: Vytvoř si Notion databázi**
1. **Vytvoř novou databázi** v Notion
2. **Sloupce:** URL, Title, Crawled At, Markdown link, Status
3. **Zkopíruj Database ID** z URL
4. **Vytvoř Notion integration** a zkopíruj token

### **KROK 7: Vytvoř si vlastní GitHub repo**
1. **Vytvoř nový repozitář** na GitHubu
2. **Nastav na Public**
3. **Zkopíruj URL**

### **KROK 8: Nastav .env soubor**
1. **Přejmenuj** `.env.example` na `.env`
2. **Vyplň:**
```env
FIRECRAWL_API_KEY=tvůj_firecrawl_klíč
NOTION_API_KEY=tvůj_notion_token
NOTION_DATABASE_ID=tvůj_database_id
GITHUB_REPO_URL=https://github.com/tvoje_jmeno/tvůj_repo
GITHUB_TOKEN=tvůj_github_token
```

### **KROK 9: Spusť crawler**
```bash
node src/crawl.mjs --urls "https://example.com"
```

### **🎉 HOTOVO!**
- Soubory se nahrají na tvůj GitHub
- Odkazy v Notion budou fungovat
- Můžeš crawlovat libovolné weby

---

## 🛠️ Použití:

### Jeden web:
```bash
node src/crawl.mjs --urls "https://example.com"
```

### Více webů najednou:
```bash
node src/crawl.mjs --urls "https://example.com,https://test.com"
```

### Ze souboru:
```bash
node src/crawl.mjs --file urls.txt
```

---

## ❓ Pokud něco nefunguje:

- Zkontroluj že máš všechny API klíče správně
- Repozitář musí být Public
- Všechny sloupce v Notion musí mít správné názvy
- GitHub token musí mít oprávnění "repo"

---

## 📁 Struktura projektu:

```
/
├── src/
│   ├── crawl.mjs      # Hlavní skript
│   ├── firecrawl.js   # Firecrawl API wrapper
│   ├── filesystem.js  # Lokální ukládání
│   ├── github.js      # GitHub API upload
│   ├── notion.js      # Notion integrace
│   └── utils.js       # Pomocné funkce
├── content/           # Vygenerované markdown soubory
├── package.json
├── .env.example       # Šablona environment proměnných
└── README.md
```

---

## 🤝 Přispívání

Pokud najdeš chybu nebo máš nápad na vylepšení, vytvoř Issue nebo Pull Request!

---

## 📄 Licence

MIT
