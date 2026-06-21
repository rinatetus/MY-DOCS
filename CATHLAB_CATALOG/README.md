# CathLab Catalog

אתר קטלוג ציוד מעבדת קטטריזציה — HTML סטטי פשוט, ללא צורך בהתקנות.

## ייבוא נתונים מ-Excel

1. לחצי על כפתור **📥 ייבא מ-Excel** בראש האתר
2. בחרי את קובץ ה-Excel שלך (`.xlsx` / `.xls` / `.csv`)
3. המוצרים יופיעו אוטומטית — הנתונים נשמרים גם אחרי רענון

### כותרות עמודות מומלצות

| עברית | English | תיאור |
|-------|---------|-------|
| שם מוצר | name | שם המוצר (חובה) |
| קטגוריה | category | קטגוריה לסינון |
| יצרן | manufacturer | שם היצרן |
| מק"ט | ref | מספר קטלוג |
| תיאור | description | תיאור קצר |
| מידות | sizes | מידות מופרדות בפסיקים |
| הערות | notes | הערות נוספות |
| תמונה | image | נתיב לתמונה (images/xxx.jpg) |

> הכותרות בשורה הראשונה של הגיליון — האתר יזהה אותן אוטומטית.

## הרצה מקומית

**VS Code — הדרך הקלה:**
1. התקיני תוסף [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. לחצי ימין על `index.html` → *Open with Live Server*

## מבנה הקבצים

```
CATHLAB_CATALOG/
├── index.html          ← דף ראשי
├── css/style.css       ← עיצוב
├── js/app.js           ← לוגיקת חיפוש, סינון וייבוא Excel
├── data/products.json  ← נתוני ברירת מחדל (לדוגמה)
└── images/             ← תמונות מוצרים
```