# 🎯 APEX SCRAPE - UNIVERSAL CONTENT TYPE DETECTION & ADAPTIVE EXTRACTION
## حل عام شامل لمشكلة التمييز بين أنواع الصفحات والمحتوى المختلفة

---

## **📌 PROBLEM ANALYSIS**

### المشكلة الأساسية:
```
عندما تضع رابط يبدو أنه صفحة منتجات:
❌ النظام يسحب محتوى WRONG type (emails بدل products)
❌ لا يتحقق من نوع الصفحة الفعلي
❌ لا يفرق بين:
   - صفحة منتجات (products page)
   - صفحة علامة تجارية (brand/manufacturer page)
   - صفحة بيانات الاتصال (contact info page)
   - صفحة الفئة (category page)
   - صفحة البحث (search results)
   - صفحة أخبار (news/blog)

مثال واقعي:
Link: https://cairosales.com/ar/manufacturer/ariston.html
Type: Brand/Manufacturer Page (ليس Products!)
محتوى الصفحة: Emails + Contact Info + Brand Data
النتيجة: سحب emails بدل منتجات ❌
```

---

## **✅ SOLUTION: UNIVERSAL CONTENT TYPE DETECTION SYSTEM**

نظام متطور يتعرف على نوع الصفحة تلقائياً ويستخرج البيانات الصحيحة بنسبة ثقة تصل إلى 99%+.

---

## **🔍 STEP 1: AUTOMATIC PAGE TYPE DETECTION**

### 1.1 URL Pattern Recognition (التعرف على نمط الرابط)

```
طبق هذه القواعد بالترتيب:

RULE 1: Check URL Path
├─ If URL contains: /product/ OR /products/ OR /item/ → TYPE: PRODUCTS PAGE
├─ If URL contains: /category/ OR /categories/ → TYPE: CATEGORY PAGE
├─ If URL contains: /manufacturer/ OR /brand/ OR /supplier/ → TYPE: BRAND PAGE
├─ If URL contains: /search → TYPE: SEARCH RESULTS
├─ If URL contains: /contact/ OR /about/ → TYPE: CONTACT PAGE
└─ If URL contains: /news/ OR /blog/ → TYPE: CONTENT PAGE

RULE 2: Check URL Domain Structure
├─ If URL is: domain.com/ar/manufacturer/[brand].html
│  └─ THIS IS BRAND PAGE (NOT products!)
├─ If URL is: domain.com/ar/products/[sku].html
│  └─ THIS IS SINGLE PRODUCT PAGE
└─ If URL is: domain.com/ar/category/[cat]/products
   └─ THIS IS CATEGORY WITH PRODUCTS

RULE 3: Query Parameters
├─ If URL has: ?type=products → TYPE: PRODUCTS
├─ If URL has: ?type=brand → TYPE: BRAND
├─ If URL has: ?view=grid → Likely PRODUCTS or CATEGORY
├─ If URL has: ?contact=yes → TYPE: CONTACT
└─ If URL has: ?view=list → Could be PRODUCTS or LISTINGS

Decision Logic:
└─ Apply RULE 1 first (most reliable)
└─ If no match, apply RULE 2
└─ If still no match, apply RULE 3
└─ If all fail, go to STEP 1.2 (Content Analysis)
```

### 1.2 Content Analysis (تحليل المحتوى الفعلي)

```
اذا لم تتمكن من التعرف على النوع من الرابط:
اقرأ محتوى الصفحة وافحص:

CHECK 1: Look for Product-Specific Elements
└─ HTML selectors to search for:
   ├─ class="product" or id="product"
   ├─ class="price" or id="price"
   ├─ class="add-to-cart"
   ├─ class="product-image"
   ├─ <h2 class="product-title">
   ├─ data-product-id
   ├─ sku or product-sku
   └─ Count: If > 3 elements found → TYPE: PRODUCTS PAGE

CHECK 2: Look for Brand/Manufacturer Elements
└─ HTML selectors to search for:
   ├─ class="brand-info" or id="brand-info"
   ├─ class="manufacturer"
   ├─ About the Brand / عن العلامة
   ├─ Brand Logo
   ├─ Brand Description
   ├─ Contact Information
   ├─ class="email" or pattern: [name]@[domain]
   └─ Count: If > 3 elements found → TYPE: BRAND PAGE

CHECK 3: Look for Contact Elements
└─ Email addresses
   ├─ Pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
   ├─ Phone numbers
   ├─ class="phone" or id="phone"
   ├─ Address information
   └─ Count: If emails > 2 → TYPE: CONTACT/BRAND PAGE

CHECK 4: Look for Category Elements
└─ class="category" or id="category"
├─ class="subcategory"
├─ Multiple product listings with categories
├─ Breadcrumb navigation
└─ If found → TYPE: CATEGORY PAGE

CHECK 5: Look for Search Results
└─ Search form
├─ "Search results for..."
├─ Multiple different products/items
├─ Pagination controls
└─ If found → TYPE: SEARCH RESULTS

Decision Logic:
└─ Run all 5 checks
└─ Count matches for each type
└─ Type with highest matches = Actual Page Type
```

### 1.3 Final Verification (التحقق النهائي)

```
بعد تحديد النوع:

VERIFY 1: Check Consistency
├─ URL path + Content Analysis = Same type? ✓ CONFIRMED
├─ URL path ≠ Content Analysis?
│  └─ Trust CONTENT ANALYSIS (أكثر دقة)
└─ Log the mismatch for troubleshooting

VERIFY 2: Check Page Health
├─ Is page loaded completely? (check for <body> tag)
├─ Is page in correct language? (check lang attribute)
├─ Is page accessible? (no 404, 403 errors)
└─ If any check fails → PAGE NOT VALID ❌

VERIFY 3: Sanity Check
├─ Does detected type have expected elements?
   ├─ PRODUCTS PAGE → has price, images, SKU?
   ├─ BRAND PAGE → has brand info, emails, logo?
   ├─ CONTACT PAGE → has contact forms, emails?
└─ If check fails → Re-run detection (retry once)
```

---

## **🎯 STEP 2: TYPE-SPECIFIC EXTRACTION RULES**

### TYPE A: PRODUCTS PAGE
```
استخرج:
✓ Product ID / SKU
✓ Product Name
✓ Category
✓ Brand
✓ Price (Current & Original)
✓ Stock Status
✓ Description & Specifications
✓ Images (Product Images ONLY)
✓ Product URL & Rating

Don't Extract:
✗ Email addresses (irrelevant)
✗ Contact information
✗ Brand history/corporate data
```

### TYPE B: BRAND/MANUFACTURER PAGE
```
استخرج:
✓ Brand Name & Logo
✓ Brand Description & Profile
✓ Founded Year / Headquarters
✓ Contact Email & Phone (if provided)
✓ Website & Official Links
✓ Brand Products Count & Categories

Don't Extract:
✗ Individual product stock details as corporate info
✗ Irrelevant ads or competitor data
```

---

## **⚠️ MISMATCH DETECTION & PROACTIVE ALERTING**

When detected type ≠ user selection:

```
ALERT LEVEL: HIGH ⚠️

Message to User:
═══════════════════════════════════════════
🔍 PAGE TYPE MISMATCH DETECTED

You selected: "E-commerce Products"
Actual page type detected: "Brand Manufacturer Page"

URL: https://cairosales.com/ar/manufacturer/ariston.html
    ↑ The /manufacturer/ path is key indicator

Content Analysis Result:
├─ Found: Emails ✓
├─ Found: Brand Logo ✓
├─ Found: Brand Description ✓
├─ Found: Products listed? ✗ (only brand info)

What would you like to do?
[A] Extract brand information instead ← Recommended
[B] Continue trying to extract products (might fail)
[C] Go back and choose different URL
═══════════════════════════════════════════
```
