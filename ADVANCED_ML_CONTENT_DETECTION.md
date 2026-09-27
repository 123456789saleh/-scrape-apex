# 🤖 ADVANCED CONTENT TYPE DETECTION WITH ML HINTS
## كشف متقدم لأنواع الصفحات مع استخدام تقنيات إحصائية وهندسية متطورة

---

## **📌 ADVANCED DETECTION ALGORITHM**

هذا النظام يستخدم تقنيات متقدمة لتحسين دقة الكشف:

### 1. STATISTICAL CONTENT ANALYSIS

```
احسب النسب الإحصائية للمحتوى:

RATIO 1: Product-to-Other Elements Ratio
└─ If 70%+ of content has product attributes
   └─ → PAGE TYPE = PRODUCTS (عالي الثقة)

RATIO 2: Email-to-Product Ratio
└─ If emails > 5 AND products = 0
   └─ → PAGE TYPE = CONTACT/BRAND (عالي الثقة)

RATIO 3: Price Information Density
└─ If >50% of items have prices
   └─ → PAGE TYPE = PRODUCTS

RATIO 4: Category Information Density
└─ If >30% of content has category labels
   └─ → PAGE TYPE = CATEGORY

RATIO 5: Temporal Content (Dates)
└─ If >70% items have dates
   └─ → PAGE TYPE = NEWS/BLOG
```

### 2. STRUCTURAL PATTERN MATCHING & CONFIDENCE SCORE

```
Confidence Score Calculation:
└─ Final_Confidence = (
     (URL_score × 0.30) +
     (Metadata_score × 0.25) +
     (Content_score × 0.25) +
     (Structure_score × 0.20)
   ) / 100

Confidence Tiers:
├─ Score >= 90% → VERY HIGH CONFIDENCE (Extract directly)
├─ Score 70-90% → HIGH CONFIDENCE (Extract with note)
├─ Score 50-70% → MEDIUM CONFIDENCE (Alert user for verification)
└─ Score < 50%  → LOW CONFIDENCE (Request explicit confirmation)
```

### 3. TYPE-SPECIFIC DETECTION OPTIMIZATIONS

- **PRODUCTS**: Price selectors, Add to Cart buttons, SKU patterns, Ratings.
- **BRAND**: Brand name, Logo, Corporate description, Official contacts.
- **CATEGORY**: Breadcrumbs, Subcategories filter, Price slider, Products grid.
- **CONTACT**: Contact form, Dedicated email addresses, Telephone numbers, Physical address.
- **SEARCH RESULTS**: Search query keyword, Pagination, Multi-entity mixed results.
