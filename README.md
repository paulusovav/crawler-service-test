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

---

## 🔄 Proč GitHub jako úložiště?

### **Verzování a historie změn**
V dnešním rychle se měnícím digitálním světě se obsah webových stránek mění denně. GitHub nám poskytuje dokonalé verzování - když stáhneme stejný web podruhé, původní soubor se přepíše a Git automaticky uchová historii všech změn. Můžeme tak snadno porovnávat, jak se obsah vyvíjel v čase.

### **Pravidelné monitorování**
Do budoucna plánujeme pravidelné crawlování (denní/týdenní) pro zachování aktuálnosti informací. Díky Git historii budeme moci:
- Sledovat změny v obsahu konkurence
- Analyzovat trendy a vývoj messaging
- Detekovat aktualizace produktů a služeb
- Vytvářet timeline změn pro strategické rozhodování

### **Snadné sdílení a kolaborace**
GitHub umožňuje snadné sdílení crawlovaného obsahu s týmem, přístupnost přes raw odkazy v Notion a možnost stažení kompletní historie jedním kliknutím.

---

## 🚀 Co je v plánu dál

### **1. AI-powered čištění obsahu**
Integrace s OpenAI API pro inteligentní post-processing crawlovaných dat:
- Automatické čištění a formátování markdown souborů
- Extrakce klíčových informací a metadata
- Strukturování obsahu do konzistentních formátů
- Odstranění redundantního obsahu (navigace, footery, reklamy)

### **2. Webový frontend**
Vytvoření intuitivního webového rozhraní pro snadné používání:
- **Crawlování na jedno kliknutí** - žádné terminálové příkazy
- Vizuální správa seznamu webů k monitorování
- Real-time dashboard s průběhem crawlování
- Historie a porovnání verzí přímo v prohlížeči

### **3. Pokročilé analýzy jedním kliknutím**
Automatizované analýzy nad crawlovaným obsahem například:
- **Tone of Voice analýza** - porovnání komunikačního stylu konkurence
- **Content gap analysis** - identifikace témat, která konkurence pokrývá
- **Keyword density reports** - SEO analýza konkurenčního obsahu
- **Brand messaging tracking** - sledování změn v pozitioningu
- **Trend detection** - automatické odhalování emerging topics

### **4. Pokročilé funkce**
- **Scheduled crawling** - automatické pravidelné stahování
- **Batch operations** - hromadné zpracování set webů podle kategorií
- **Alerts & notifications** - upozornění na významné změny obsahu
- **Export capabilities** - export dat do různých formátů (PDF, Excel, JSON)
- **Team collaboration** - sdílení a komentování crawlovaného obsahu

### **5. Integrace s dalšími nástroji**
- **Slack/Teams notifications** při detekci změn
- **Airtable/Notion sync** pro pokročilé databázové operace
- **Analytics tools** pro měření dopadu změn na vlastní metriky
- **CRM integrace** pro propojení s customer intelligence

---

---

## 🔧 Architektura a flexibility

### **Modulární design databázových adaptérů**
Současná implementace s Notion je navržena jako **testovací řešení**, nikoli jako finální databáze. Architektura crawleru je záměrně modulární - databázový layer (`notion.js`) lze snadno vyměnit za jiný backend:

- **PostgreSQL/MySQL** pro produkční nasazení
- **Airtable** pro pokročilé databázové funkce
- **Supabase/Firebase** pro real-time synchronizaci
- **Custom API** pro specializované use-cases

Notion nám nyní slouží především pro **proof of concept** a rychlé testování funkcionality. Při přechodu na produkční databázi stačí vyměnit jeden modul, zbytek aplikace zůstane beze změny.

---

### 🎯 **Vize produktu**
Transformace z jednoduchého crawleru na komplexní **competitive intelligence platform**, která automatizuje sledování digitální konkurence a poskytuje actionable insights pro strategické rozhodování v real-time.
