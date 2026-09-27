import React, { useState } from 'react';
import { ScrapeConfig } from '../../types/scraper.ts';
import { Code, Copy, Check, Terminal } from 'lucide-react';
import { copyToClipboard } from '../../lib/utils.ts';

interface CodeSnippetViewProps {
  config: ScrapeConfig;
  lang: 'ar' | 'en';
}

export const CodeSnippetView: React.FC<CodeSnippetViewProps> = ({ config, lang }) => {
  const [activeLang, setActiveLang] = useState<'python_bs4' | 'python_playwright' | 'nodejs_cheerio' | 'curl'>('python_bs4');
  const [copied, setCopied] = useState(false);

  const isAr = lang === 'ar';

  const snippets: Record<string, string> = {
    python_bs4: `import requests
from bs4 import BeautifulSoup
import json

url = "${config.url}"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
}

response = requests.get(url, headers=headers, timeout=15)
soup = BeautifulSoup(response.text, 'html.parser')

print(f"Page Title: {soup.title.string if soup.title else 'No Title'}")

# Extract products or data
items = []
for card in soup.select(".product-card, .prd, article"):
    title = card.select_one("h2, h3, .title")
    price = card.select_one(".price, .prc")
    if title and price:
        items.append({
            "title": title.get_text(strip=True),
            "price": price.get_text(strip=True)
        })

print(f"Extracted {len(items)} items.")
print(json.dumps(items[:3], indent=2, ensure_ascii=False))`,

    python_playwright: `import asyncio
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        await page.goto("${config.url}", wait_until="networkidle")
        
        title = await page.title()
        print(f"Page Title: {title}")
        
        # Scrape dynamic elements
        cards = await page.query_selector_all(".product-card, .prd, article, table tr")
        print(f"Found {len(cards)} elements.")
        await browser.close()

asyncio.run(main())`,

    nodejs_cheerio: `import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrape() {
  const url = '${config.url}';
  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'ar,en-US;q=0.9'
    }
  });

  const $ = cheerio.load(html);
  const title = $('title').text();
  console.log('Title:', title);

  const results = [];
  $('table tbody tr, .product-card').each((_, el) => {
    results.push($(el).text().trim().replace(/\\s+/g, ' '));
  });

  console.log('Found records:', results.length);
}

scrape();`,

    curl: `curl -X GET "${config.url}" \\
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" \\
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \\
  -H "Accept-Language: ar,en-US;q=0.9,en;q=0.8" \\
  --compressed \\
  -o page_output.html`
  };

  const handleCopy = () => {
    copyToClipboard(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0F1419] border border-[#1E293B] rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-[#00D9FF]" />
            <span>{isAr ? 'كود برمجي مستقل لتكرار هذه العملية برمجياً:' : 'Export Executable Scraper Code:'}</span>
          </h4>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {isAr ? 'كود جاهز للتشغيل مباشرة في Python أو Node.js أو cURL' : 'Production-ready code snippets for Python, Node.js, and cURL'}
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 bg-[#161F2E] p-1 rounded-xl border border-[#1E293B]">
          <button
            onClick={() => setActiveLang('python_bs4')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeLang === 'python_bs4' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Python (BS4)
          </button>
          <button
            onClick={() => setActiveLang('python_playwright')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeLang === 'python_playwright' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Playwright
          </button>
          <button
            onClick={() => setActiveLang('nodejs_cheerio')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeLang === 'nodejs_cheerio' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Node.js
          </button>
          <button
            onClick={() => setActiveLang('curl')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeLang === 'curl' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            cURL
          </button>
        </div>
      </div>

      {/* Code Box */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] text-xs font-medium text-[#E2E8F0] border border-[#1E293B] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#00D9FF]" />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>

        <pre className="bg-[#0B0F15] p-4 rounded-xl border border-[#1E293B] text-xs font-mono text-[#E2E8F0] overflow-x-auto max-h-96 scrollbar-thin pt-10">
          {snippets[activeLang]}
        </pre>
      </div>
    </div>
  );
};
