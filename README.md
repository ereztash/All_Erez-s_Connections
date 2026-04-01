# מאגר הפניות של הרשת שלי

מאגר הפניות מבוסס בעיה ופתרון. לא פלטפורמת פרילנסרים. לא לינקדאין נוסף.

## הרצה

```bash
npm install
node server.js
```

פתח http://localhost:3001

## API

| Method | Route | תיאור |
|--------|-------|-------|
| GET | /api/people?q=AI&cluster=automation-paralysis | חיפוש + סינון |
| GET | /api/people/:id | אדם ספציפי |
| POST | /api/people | הוספת אדם (name, problem, solution) |
| PUT | /api/people/:id | עדכון |
| DELETE | /api/people/:id | מחיקה |
| GET | /api/clusters | סיכום אשכולות |
| GET | /api/stats | סטטיסטיקות |

## מבנה

```
referral-app/
├── server.js          # Express API
├── data/people.json   # מאגר נתונים
├── public/index.html  # Frontend
└── package.json
```

## COR-SYS
