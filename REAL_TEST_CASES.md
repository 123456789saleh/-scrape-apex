# 🧪 CONTENT TYPE DETECTION - REAL TEST CASES
## حالات اختبار واقعية من cairosales.com والمتاجر العالمية

---

## **TEST CASE 1: The Manufacturer/Brand Page Scenario**

### URL
```
https://cairosales.com/ar/manufacturer/ariston.html
```

### Detection Analysis
- **URL Pattern**: `/ar/manufacturer/` → BRAND/MANUFACTURER PAGE (Confidence: 85%)
- **Content Signals**: Brand Logo, Brand Description, Official Contact Emails.
- **Mismatch Alert**: Triggered if mode is "Products".
- **Resolution**: Adaptive Extraction of Brand Profile + Brand's Associated Products without corrupting fields.

---

## **TEST CASE 2: Category Page with Products**

### URL
```
https://cairosales.com/ar/category/dishwashers
```

### Detection Analysis
- **URL Pattern**: `/ar/category/dishwashers` → CATEGORY PAGE (Confidence: 85%)
- **Content Signals**: Product grids, Prices, Add to cart buttons, Breadcrumbs.
- **Match Status**: Matched with "Products" mode → Proceed with 100% precision.

---

## **TEST CASE 3: Search Results Page**

### URL
```
https://cairosales.com/ar/search?q=samsung
```

### Detection Analysis
- **URL Pattern**: `/search?q=` → SEARCH RESULTS PAGE (Confidence: 90%)
- **Content Signals**: Query indicators, Filter bars, Mixed products and categories.
- **Resolution**: Offers to extract pure products or all results.

---

## **TEST CASE 4: Contact Information Page**

### URL
```
https://cairosales.com/ar/contact-us
```

### Detection Analysis
- **URL Pattern**: `/contact-us` → CONTACT PAGE (Confidence: 98%)
- **Content Signals**: Form inputs, Customer service emails, Phone numbers.
- **Mismatch Alert**: High severity if user selected "Products", smoothly routes to Contact Leads extraction.
