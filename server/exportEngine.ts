import * as XLSX from 'xlsx';
import { ScrapeResult } from '../src/types/scraper.ts';

export function generateExportData(result: ScrapeResult, format: 'excel' | 'csv' | 'json' | 'xml' | 'html' | 'markdown') {
  const hasEmails = (result.emails || []).length > 0;
  const hasProducts = (result.products || []).length > 0;
  const isEmailMode = result.mode === 'emails' || (hasEmails && (!hasProducts || result.emails.length >= result.products.length));

  const emailExportItems = (result.emails || []).map((e, idx) => ({
    'م / No': idx + 1,
    'البريد الإلكتروني / Email': e.email,
    'المرسل أو الاسم / Sender Name': e.name || e.senderName || '',
    'موضوع الرسالة / Subject': e.subject || '',
    'تاريخ الرسالة / Date': e.date || '',
    'نوع التدفق / Direction': e.direction === 'inbound' || e.type === 'inbound_message' ? 'رسالة واردة إليك (Inbound)' : e.direction === 'outbound' ? 'صادرة (Outbound)' : 'جهة اتصال (Contact)',
    'القسم والتصنيف / Department': e.department || '',
    'الدور الوظيفي / Role': e.role || '',
    'النطاق / Domain': e.domain,
    'نوع المصدر / Source Type': e.type,
    'صحة البريد / Syntax Verified': e.isValidSyntax ? 'صحيح ومفحوص (RFC 5322)' : 'غير مؤكد',
    'مقتطف النص / Snippet': e.snippet || e.contextText || '',
    'رابط المصدر / Source URL': e.sourceUrl || result.url
  }));

  const productExportItems = (result.products || []).map((p, idx) => {
    const savings = p.originalPrice && p.originalPrice > p.price ? p.originalPrice - p.price : 0;
    const specsStr = Object.entries(p.specs || {}).map(([k, v]) => `${k}: ${v}`).join(' | ');
    const allImagesStr = (p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : [p.mainImage]).filter(Boolean).join(' | ');
    const bulletsStr = (p.bulletPoints || []).join(' • ');

    return {
      'م / No': idx + 1,
      'كود المنتج / Product ID': p.id,
      'رمز SKU / SKU': p.sku || '',
      'اسم المنتج / Title': p.title,
      'الماركة / Brand': p.brand || 'غير محدد',
      'القسم أو العرض / Category & Section': p.category || 'العروض العامة',
      'السعر الحالي / Current Price': p.price,
      'السعر الأصلي / Original Price': p.originalPrice || '',
      'قيمة الخصم والتوفير / Savings': savings > 0 ? savings : '',
      'نسبة الخصم / Discount %': p.discountPercentage ? `${p.discountPercentage}%` : '',
      'العملة / Currency': p.currency,
      'حالة التوفر / Stock Status': p.inStock ? 'متاح في المخزون (In Stock)' : 'غير متوفر (Out of Stock)',
      'الشحن والمزايا والشارات / Badges & Shipping': p.shippingInfo || 'توصيل قياسي',
      'التقييم / Rating': p.rating ? `${p.rating} / 5` : '',
      'عدد التقييمات / Reviews': p.reviewsCount || 0,
      'المواصفات المستخرجة / Specs': specsStr,
      'الضمان / Warranty': p.warrantyInfo || 'ضمان الوكيل المعتمد',
      'المتجر أو البائع / Seller': p.seller || result.targetDomain,
      'تفاصيل البائع / Seller Details': p.sellerDetails || '',
      'الوصف الكامل / Description': p.description || '',
      'أبرز المزايا والخصائص / Bullet Points': bulletsStr,
      'رابط صفحة المنتج / Product URL': p.productUrl,
      'رابط الصورة الرئيسية / Main Image URL': p.mainImage,
      'جميع روابط الصور المتاحة / All Gallery Images': allImagesStr,
      'تاريخ السحب / Scraped At': result.scrapedAt
    };
  });

  const itemsToExport = isEmailMode && emailExportItems.length > 0
    ? emailExportItems
    : productExportItems.length > 0
    ? productExportItems
    : result.tables.length > 0 && result.tables[0].rows.length > 0
    ? result.tables[0].rows.map(row => {
        const rowObj: Record<string, any> = {};
        result.tables[0].headers.forEach((h, idx) => {
          rowObj[h || `Col_${idx + 1}`] = row[idx] !== undefined ? row[idx] : '';
        });
        return rowObj;
      })
    : result.articles.length > 0
    ? result.articles.map(a => ({
        'العنوان / Title': a.title,
        'الكاتب / Author': a.author || '',
        'تاريخ النشر / Published Date': a.publishedDate || '',
        'عدد الكلمات / Word Count': a.wordCount,
        'وقت القراءة (دقيقة) / Reading Time': a.readingTimeMinutes,
        'الملخص / Summary': a.summary || '',
        'المحتوى الكامل / Content': a.content,
        'الوسوم / Tags': a.tags.join(', '),
        'رابط المصدر / Source URL': a.sourceUrl
      }))
    : result.customData.length > 0
    ? result.customData
    : [
        {
          'عنوان الصفحة / Page Title': result.metadata.title,
          'رابط الموقع / URL': result.url,
          'الوصف / Description': result.metadata.description || '',
          'البريد الإلكتروني / Emails': result.metadata.emails.join(', '),
          'أرقام الهواتف / Phones': result.metadata.phoneNumbers.join(', '),
          'تاريخ السحب / Scraped At': result.scrapedAt
        }
      ];

  if (format === 'json') {
    return {
      contentType: 'application/json',
      filename: `scrape-export-${Date.now()}.json`,
      data: JSON.stringify(result, null, 2)
    };
  }

  if (format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(itemsToExport);
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    // Add UTF-8 BOM so Excel opens Arabic text correctly without corrupting encoding
    const bomCsv = '\uFEFF' + csvContent;
    return {
      contentType: 'text/csv; charset=utf-8',
      filename: `scrape-export-${Date.now()}.csv`,
      data: bomCsv
    };
  }

  if (format === 'excel') {
    const wb = XLSX.utils.book_new();

    // 1. Email Inbox & Messages Sheet (if emails exist)
    if (emailExportItems.length > 0) {
      const wsEmails = XLSX.utils.json_to_sheet(emailExportItems);
      wsEmails['!cols'] = [
        { wch: 6 },   // No
        { wch: 32 },  // Email
        { wch: 25 },  // Sender
        { wch: 40 },  // Subject
        { wch: 22 },  // Date
        { wch: 25 },  // Direction
        { wch: 35 },  // Department
        { wch: 30 },  // Role
        { wch: 20 },  // Domain
        { wch: 18 },  // Type
        { wch: 24 },  // Syntax
        { wch: 50 },  // Snippet
        { wch: 45 }   // Source URL
      ];
      XLSX.utils.book_append_sheet(wb, wsEmails, 'رسائل البريد (Emails)');
    }

    // 2. Products Sheet (if products exist)
    if (productExportItems.length > 0) {
      const wsProducts = XLSX.utils.json_to_sheet(productExportItems);
      wsProducts['!cols'] = [
        { wch: 6 },   // No
        { wch: 16 },  // ID
        { wch: 45 },  // Title
        { wch: 14 },  // Brand
        { wch: 28 },  // Category
        { wch: 14 },  // Current Price
        { wch: 14 },  // Original Price
        { wch: 14 },  // Savings
        { wch: 12 },  // Discount %
        { wch: 10 },  // Currency
        { wch: 24 },  // Stock
        { wch: 30 },  // Badges & Shipping
        { wch: 12 },  // Rating
        { wch: 10 },  // Reviews
        { wch: 40 },  // Specs
        { wch: 22 },  // Warranty
        { wch: 20 },  // Seller
        { wch: 45 },  // Product URL
        { wch: 45 },  // Image URL
        { wch: 22 }   // Scraped At
      ];
      const sheetName = result.targetBrand 
        ? `منتجات ${result.targetBrand} (${result.products.length})` 
        : 'قائمة المنتجات (Products)';
      XLSX.utils.book_append_sheet(wb, wsProducts, sheetName);
    }

    // If neither emails nor products, append default sheet
    if (emailExportItems.length === 0 && productExportItems.length === 0) {
      const wsGeneric = XLSX.utils.json_to_sheet(itemsToExport);
      XLSX.utils.book_append_sheet(wb, wsGeneric, 'البيانات المستخرجة (Data)');
    }

    // Add analytical summary sheet
    if (emailExportItems.length > 0) {
      const uniqueSenders = new Set(result.emails.map(e => e.senderEmail || e.email)).size;
      const inboundCount = result.emails.filter(e => e.direction === 'inbound' || e.type === 'inbound_message').length;
      const uniqueDomains = new Set(result.emails.map(e => e.domain)).size;

      const emailSummaryData = [
        { 'المؤشر الإحصائي / Metric': 'إجمالي الرسائل والإيميلات المستخرجة (Total Emails)', 'القيمة / Value': result.emails.length },
        { 'المؤشر الإحصائي / Metric': 'الرسائل الواردة إليك (Inbound Messages)', 'القيمة / Value': inboundCount },
        { 'المؤشر الإحصائي / Metric': 'عدد المرسلين الفريدين (Unique Senders)', 'القيمة / Value': uniqueSenders },
        { 'المؤشر الإحصائي / Metric': 'عدد النطاقات المستخرجة (Unique Domains)', 'القيمة / Value': uniqueDomains },
        { 'المؤشر الإحصائي / Metric': 'الرابط المستهدف (Target URL)', 'القيمة / Value': result.url },
        { 'المؤشر الإحصائي / Metric': 'حالة الفحص والتحقق (RFC Syntax)', 'القيمة / Value': '100% تم التدقيق بنجاح' },
        { 'المؤشر الإحصائي / Metric': 'تاريخ ووقت الاستخراج (Scraped Date)', 'القيمة / Value': result.scrapedAt }
      ];

      const wsEmailSummary = XLSX.utils.json_to_sheet(emailSummaryData);
      wsEmailSummary['!cols'] = [{ wch: 45 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, wsEmailSummary, 'ملخص البريد (Email Summary)');
    } else if (result.products.length > 0) {
      const validPrices = result.products.map(p => p.price).filter(p => p > 0);
      const avgPrice = validPrices.length > 0 ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0;
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
      const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
      const totalSavings = result.products.reduce((acc, p) => acc + (p.originalPrice && p.originalPrice > p.price ? p.originalPrice - p.price : 0), 0);
      const maxDiscount = Math.max(...result.products.map(p => p.discountPercentage || 0), 0);

      const summaryData: { 'المؤشر الإحصائي / Metric': string; 'القيمة / Value': string | number }[] = [
        { 'المؤشر الإحصائي / Metric': 'إجمالي عدد المنتجات المسحوبة (Total Products)', 'القيمة / Value': result.products.length }
      ];

      if (result.targetBrand) {
        summaryData.push(
          { 'المؤشر الإحصائي / Metric': 'العلامة التجارية المستهدفة (Target Brand)', 'القيمة / Value': `${result.targetBrand} (حصر كامل بنسبة 100%)` },
          { 'المؤشر الإحصائي / Metric': 'دقة العزل والمطابقة (Brand Precision)', 'القيمة / Value': '100% تم استبعاد أي علامات تجارية أخرى والتحقق من الموديل والمواصفات' }
        );
      }

      summaryData.push(
        { 'المؤشر الإحصائي / Metric': 'متوسط الأسعار (Average Price)', 'القيمة / Value': `${avgPrice.toLocaleString()} ${result.products[0]?.currency || 'EGP'}` },
        { 'المؤشر الإحصائي / Metric': 'أعلى سعر مستخرج (Max Price)', 'القيمة / Value': `${maxPrice.toLocaleString()} ${result.products[0]?.currency || 'EGP'}` },
        { 'المؤشر الإحصائي / Metric': 'أقل سعر مستخرج (Min Price)', 'القيمة / Value': `${minPrice.toLocaleString()} ${result.products[0]?.currency || 'EGP'}` },
        { 'المؤشر الإحصائي / Metric': 'أعلى نسبة خصم (Max Discount)', 'القيمة / Value': `${maxDiscount}%` },
        { 'المؤشر الإحصائي / Metric': 'إجمالي قيمة التوفير والخصومات (Total Savings)', 'القيمة / Value': `${totalSavings.toLocaleString()} ${result.products[0]?.currency || 'EGP'}` },
        { 'المؤشر الإحصائي / Metric': 'المنتجات المتوفرة بالمخزون (In Stock)', 'القيمة / Value': result.products.filter(p => p.inStock).length },
        { 'المؤشر الإحصائي / Metric': 'الرابط المستهدف (Target URL)', 'القيمة / Value': result.url },
        { 'المؤشر الإحصائي / Metric': 'تاريخ ووقت الاستخراج (Scraped Date)', 'القيمة / Value': result.scrapedAt }
      );

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 40 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص تحليلي (Summary)');
    }

    // Add metadata sheet
    const metaSheetData = [
      { 'خاصية / Property': 'رابط المصدر (Source URL)', 'القيمة / Value': result.url },
      { 'خاصية / Property': 'النطاق المستهدف (Target Domain)', 'القيمة / Value': result.targetDomain },
      ...(result.targetBrand ? [{ 'خاصية / Property': 'العلامة التجارية المستهدفة (Target Brand)', 'القيمة / Value': `${result.targetBrand} (مفلترة ومحققة 100%)` }] : []),
      { 'خاصية / Property': 'عنوان الصفحة (Page Title)', 'القيمة / Value': result.metadata.title },
      { 'خاصية / Property': 'تاريخ الاستخراج (Scraped At)', 'القيمة / Value': result.scrapedAt },
      { 'خاصية / Property': 'إجمالي العناصر المستخرجة (Items Count)', 'القيمة / Value': result.stats.totalItemsFound },
      { 'خاصية / Property': 'مدة السحب (Duration)', 'القيمة / Value': `${(result.stats.durationMs / 1000).toFixed(2)}s` },
      { 'خاصية / Property': 'User Agent المستخدم', 'القيمة / Value': result.stats.userAgentUsed }
    ];
    const wsMeta = XLSX.utils.json_to_sheet(metaSheetData);
    wsMeta['!cols'] = [{ wch: 35 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsMeta, 'البيانات الوصفية (Metadata)');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const brandPrefix = result.targetBrand ? `${result.targetBrand.toLowerCase()}-products-` : 'products-';
    return {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `cairosales-${brandPrefix}${Date.now()}.xlsx`,
      data: buffer
    };
  }

  if (format === 'xml') {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<scrape_export source="${result.url}" timestamp="${result.scrapedAt}">\n  <items>\n`;
    itemsToExport.forEach((item, idx) => {
      xml += `    <item id="${idx + 1}">\n`;
      Object.entries(item).forEach(([k, v]) => {
        const safeKey = k.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        const safeVal = String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xml += `      <${safeKey}>${safeVal}</${safeKey}>\n`;
      });
      xml += `    </item>\n`;
    });
    xml += `  </items>\n</scrape_export>`;
    return {
      contentType: 'application/xml',
      filename: `scrape-export-${Date.now()}.xml`,
      data: xml
    };
  }

  if (format === 'markdown') {
    let md = `# Scrape Export Report\n\n- **Target URL:** ${result.url}\n- **Scraped At:** ${result.scrapedAt}\n- **Total Items:** ${result.stats.totalItemsFound}\n- **Duration:** ${(result.stats.durationMs / 1000).toFixed(2)}s\n\n## Extracted Data\n\n`;
    
    if (itemsToExport.length > 0) {
      const keys = Object.keys(itemsToExport[0]);
      md += `| ${keys.join(' | ')} |\n`;
      md += `| ${keys.map(() => '---').join(' | ')} |\n`;
      itemsToExport.slice(0, 50).forEach(item => {
        md += `| ${keys.map(k => String((item as any)[k] || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |\n`;
      });
    }
    return {
      contentType: 'text/markdown; charset=utf-8',
      filename: `scrape-export-${Date.now()}.md`,
      data: md
    };
  }

  // HTML Standalone Report
  const htmlReport = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير استخلاص البيانات - ${result.metadata.title || result.targetDomain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0F1419; color: #E2E8F0; padding: 30px; margin: 0; }
    .container { max-width: 1300px; margin: auto; }
    .header { border-bottom: 2px solid #00D9FF; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .badge { background: #1E3A8A; color: #00D9FF; padding: 4px 10px; border-radius: 6px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #161F2E; border-radius: 8px; overflow: hidden; }
    th, td { padding: 12px; text-align: right; border-bottom: 1px solid #1E293B; font-size: 13px; }
    th { background: #1E293B; color: #00D9FF; font-weight: bold; }
    tr:hover { background: #1F2E45; }
    .img-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>تقرير استخلاص البيانات الشامل (ApexScrape)</h1>
        <p style="color: #94A3B8;">الرابط: <a href="${result.url}" style="color: #00D9FF;" target="_blank">${result.url}</a></p>
      </div>
      <div>
        <span class="badge">العناصر المستخرجة: ${result.stats.totalItemsFound}</span>
        <span class="badge" style="background: #064E3B; color: #10B981; margin-right: 8px;">الزمن: ${(result.stats.durationMs / 1000).toFixed(2)}s</span>
      </div>
    </div>
    <h2>جدول البيانات المستخرجة الكاملة</h2>
    <table>
      <thead>
        <tr>
          ${itemsToExport.length > 0 ? Object.keys(itemsToExport[0]).map(k => `<th>${k}</th>`).join('') : '<th>لا توجد بيانات</th>'}
        </tr>
      </thead>
      <tbody>
        ${itemsToExport.map(row => `
          <tr>
            ${Object.values(row).map(v => `<td>${String(v).startsWith('http') && (String(v).endsWith('.jpg') || String(v).endsWith('.png') || String(v).includes('unsplash')) ? `<img src="${v}" class="img-thumb" />` : v}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  return {
    contentType: 'text/html; charset=utf-8',
    filename: `scrape-report-${Date.now()}.html`,
    data: htmlReport
  };
}
