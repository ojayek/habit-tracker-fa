# ردیاب عادت ماهانه (شمسی)

## اجرا

```bash
npm install
npm start
```

سپس در مرورگر باز کن: http://localhost:3000

## اجرا با احراز هویت (توصیه می‌شود برای سرور عمومی)

```bash
AUTH_USER=me AUTH_PASS=mysecret npm start
```

## دیپلوی روی سرور

### Linux + pm2
```bash
npm i -g pm2
pm2 start server.js --name habit --update-env
pm2 save && pm2 startup
```

### Docker (اختیاری)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Render / Railway / Fly.io
فقط مخزن را وصل کن، دستور شروع `npm start`، متغیر `PORT` خودکار ست می‌شود.

## داده‌ها
# ردیاب عادت ماهانه — نسخه ۱.۱

## اجرا

```bash
pnpm install    # یا npm install
pnpm start
```

مرورگر: **http://localhost:3000**

## قابلیت‌ها

- ✅ تقویم شمسی (Jalali) کامل
- ✅ اعداد لاتین با فونت Times New Roman
- ✅ انگلیسی با فونت Libre Franklin
- ✅ فارسی با Vazirmatn وزن ۷۰۰/۸۰۰
- ✅ لوگوی بلاک‌چین در ۳ حالت: خالی، نیمه، کامل — با رنگ هر عادت
- ✅ آیکون‌ها از پکیج `thesvg` با fallback کامل
- ✅ مدیریت خطای سراسری — هیچ‌وقت crash نمی‌کند
- ✅ پس‌زمینه چرخشی زنده + هاله‌ی موس
- ✅ نمودار سینوسی + سه دونات تحلیلی
- ✅ پنل کنترل (Ctrl+K) برای مدیریت تمام المان‌ها
- ✅ سوییچ‌های toolbars برای مخفی/نمایش باکس تاریخ و ستون عادت
- ✅ ذخیره‌سازی خودکار همه تنظیمات در localStorage

## عیب‌یابی

اگر `thesvg: 0 آیکون لود شد` دیدی — مشکلی نیست، fallback داخلی کار می‌کند. برای دیدن دقیق‌تر:

```bash
node -e "const t=require('thesvg'); console.log(Object.keys(t).slice(0,10))"
```
همه چیز در فایل `data.json` کنار سرور ذخیره می‌شود. برای بکاپ، همین فایل را کپی کن.

ساختار:
```json
{
  "habits": [{ "id": "h...", "name": "ورزش صبح", "goal": 20 }],
  "records": { "1403-07": { "h...": [1, 3, 5] } }
}
```