import React, { useState } from 'react';
import { ScrapeConfig } from '../../types/scraper.ts';
import { Code, Copy, Check, Terminal } from 'lucide-react';
import { copyToClipboard } from '../../lib/utils.ts';

interface CodeSnippetViewProps {
  config: ScrapeConfig;
  lang: 'ar' | 'en';
}

export const CodeSnippetView: React.FC<CodeSnippetViewProps> = ({ config, lang }) => {
  const [activeLang, setActiveLang] = useState<'browser_scroll' | 'python_playwright' | 'python_bs4' | 'nodejs_cheerio' | 'curl'>('browser_scroll');
  const [copied, setCopied] = useState(false);

  const isAr = lang === 'ar';

  const snippets: Record<string, string> = {
    browser_scroll: `/**
 * دالة التمرير التكيفي والتكراري (Adaptive Smooth Scrolling & Infinite Scroll)
 * يمكنك لصق هذا الكود مباشرة في Console المتصفح أو في سكريبت تصفح آلي:
 */
(async function runAdaptiveInfiniteScroll() {
  console.log("🚀 بدء التمرير التكيفي والتكراري (600px في كل خطوة مع مهلة 800ms-1500ms)...");

  const stepPx = 600;
  const loadMoreKeywords = ['تحميل المزيد', 'عرض المزيد', 'load more', 'show more', 'المزيد'];
  let previousScrollHeight = 0;
  let consecutiveStables = 0;
  let currentScrollTop = window.scrollY || 0;

  // 1. Adaptive Smooth Scrolling Loop
  while (consecutiveStables < 3) {
    previousScrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

    // تمرير لأسفل بمقدار 600px دون القفز المباشر لأسفل الصفحة
    currentScrollTop += stepPx;
    window.scrollTo({ top: currentScrollTop, behavior: 'smooth' });

    // إطلاق حدث window.dispatchEvent(new Event('scroll')) صراحة لتنشيط السكريبتات المعتمدة على التمرير
    window.dispatchEvent(new Event('scroll', { bubbles: true }));
    document.dispatchEvent(new Event('scroll', { bubbles: true }));

    // تأخير زمني تكيفي من 800ms إلى 1500ms لتمكين الشبكة و AJAX من تحميل المنتجات
    const delay = Math.floor(Math.random() * (1500 - 800 + 1)) + 800;
    await new Promise(r => setTimeout(r, delay));

    // معالجة أزرار 'تحميل المزيد' تلقائياً
    const buttons = Array.from(document.querySelectorAll('button, a, .btn-load-more, .load-more'));
    for (const btn of buttons) {
      const text = (btn.textContent || '').trim().toLowerCase();
      if (loadMoreKeywords.some(kw => text.includes(kw)) || btn.matches('.btn-load-more, .load-more')) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          console.log("🔘 تم النقر على زر تحميل المزيد:", text.substring(0, 30));
          btn.click();
          consecutiveStables = 0;
          await new Promise(r => setTimeout(r, 2000)); // انتظار ثانيتين بعد النقر
          break;
        }
      }
    }

    const currentScrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    if (previousScrollHeight === currentScrollHeight && (window.innerHeight + window.scrollY) >= (currentScrollHeight - 100)) {
      consecutiveStables++;
      console.log(\`⏳ فحص ثبات الارتفاع (\${consecutiveStables}/3)... \${currentScrollHeight}px\`);
    } else {
      consecutiveStables = 0;
    }
  }

  // تجميع كافة المنتجات المسحوبة (DOM Accumulation)
  const cardSelectors = 'li.item.product-item, .product-item-info, .product-card, .grid__item, article.product, [class*="product-card"]';
  const allCards = Array.from(document.querySelectorAll(cardSelectors));
  console.log(\`✨ اكتمل التمرير بالكامل! تم تجميع \${allCards.length} كارت منتج في الـ DOM.\`);

  return allCards;
})();`,

    python_playwright: `import asyncio
import random
from playwright.async_api import async_playwright

async def scrape_with_adaptive_scroll():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        await page.goto("${config.url}", wait_until="networkidle")

        print("🚀 بدء التمرير التكيفي والتكراري...")
        previous_height = 0
        stable_count = 0
        current_scroll = 0

        # حلقة التمرير التكيفي والتكراري (Adaptive Smooth Scrolling Loop)
        while stable_count < 3:
            previous_height = await page.evaluate("document.body.scrollHeight")
            current_scroll += 600
            
            # تمرير 600px وإطلاق حدث scroll
            await page.evaluate(f"""
                window.scrollTo(0, {current_scroll});
                window.dispatchEvent(new Event('scroll'));
            """)
            
            # تأخير زمني من 800ms إلى 1500ms
            delay = random.uniform(0.8, 1.5)
            await asyncio.sleep(delay)

            # معالجة أزرار تحميل المزيد تلقائياً
            load_more = await page.query_selector("button:has-text('تحميل المزيد'), button:has-text('عرض المزيد'), button:has-text('Load More'), .btn-load-more")
            if load_more and await load_more.is_visible():
                print("🔘 تم اكتشاف زر 'تحميل المزيد' والضغط عليه...")
                await load_more.click()
                await asyncio.sleep(2.0) # انتظار ثانيتين
                stable_count = 0

            # التحقق من انتهاء الصفحة (Scroll Height Verification)
            current_height = await page.evaluate("document.body.scrollHeight")
            if previous_height == current_height:
                stable_count += 1
            else:
                stable_count = 0

        # تجميع كافة المنتجات المسحوبة (DOM Accumulation)
        cards = await page.query_selector_all("li.item.product-item, .product-item-info, .product-card, .grid__item, article.product")
        print(f"✨ تم استخراج {len(cards)} منتج بالكامل عبر الـ DOM التراكمي.")
        await browser.close()

asyncio.run(scrape_with_adaptive_scroll())`,

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
for card in soup.select("li.item.product-item, .product-item-info, .product-card, .grid__item, article.product"):
    title = card.select_one(".product-item-link, h2, h3, .title")
    price = card.select_one(".price, .price-wrapper, [data-price-amount]")
    if title and price:
        items.append({
            "title": title.get_text(strip=True),
            "price": price.get_text(strip=True)
        })

print(f"Extracted {len(items)} items.")
print(json.dumps(items[:3], indent=2, ensure_ascii=False))`,

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
  $('li.item.product-item, .product-item-info, .product-card, .grid__item, article.product').each((_, el) => {
    const cardTitle = $(el).find('.product-item-link, h2, h3, .title').text().trim();
    const price = $(el).find('.price, .price-wrapper, [data-price-amount]').text().trim();
    if (cardTitle && price) {
      results.push({ title: cardTitle, price });
    }
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
        <div className="flex items-center gap-1.5 bg-[#161F2E] p-1 rounded-xl border border-[#1E293B] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveLang('browser_scroll')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeLang === 'browser_scroll' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            {isAr ? 'التمرير اللانهائي (Browser)' : 'Browser Infinite Scroll'}
          </button>
          <button
            onClick={() => setActiveLang('python_playwright')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeLang === 'python_playwright' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Playwright
          </button>
          <button
            onClick={() => setActiveLang('python_bs4')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeLang === 'python_bs4' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Python (BS4)
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
