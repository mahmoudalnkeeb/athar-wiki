# المساهمة في أثر

أثر مشروع مفتوح لبناء مرجع عربي قابل للقراءة والإضافة. نرحب بالمقالات الموثقة، وإصلاحات الواجهة، وتحسينات الأداء، وإصلاحات إمكانية الوصول، وتحسينات أدوات الكتابة والنشر.

## قبل أن تبدأ

- افتح Issue للمشكلة أو الاقتراح الكبير قبل كتابة تغيير واسع.
- اجعل كل Pull Request مركزًا على هدف واحد.
- لا تضف معلومة تاريخية بلا مصدر قابل للتحقق.
- لا تضع أسرارًا أو بيانات شخصية أو ملفات build في المستودع.

## التطوير المحلي

يتطلب التطوير Node.js 26 أو أحدث.

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm test
npm run build
```

لتجربة محرر المقالات، شغّل `npm run article:editor` وافتح العنوان الذي يعرضه. راجع المعاينة، ثم افحص الملف الناتج وإدخاله في `src/data/registry.ts` قبل الإرسال.

## إضافة مقال

1. انسخ `src/articles/_template.ts` أو استخدم محرر المقالات المحلي.
2. اختر `slug` فريدًا بأحرف إنجليزية صغيرة وشرطات فقط.
3. أضف عنوانًا وملخصًا وفئة ووسومًا ووقت قراءة واقعيًا.
4. أضف مصادر مباشرة لكل ادعاء تاريخي يحتاج إلى توثيق.
5. استخدم `h2` ثم `h3` في بنية المقال حتى يتولد جدول المحتويات بصورة صحيحة.
6. أضف `alt` وصفيًا للصور، وتجنب الاعتماد على اللون وحده لنقل المعنى.
7. تأكد من أن المقال لا يضيف HTML أو JavaScript غير ضروري.

## أسلوب الكود والواجهة

- اتبع البنية والأنماط الموجودة قبل إضافة abstraction جديد.
- حافظ على RTL واللغة العربية أولًا، وعلى hash routes والتحميل الكسول.
- استخدم tokens الموجودة في `src/styles/tokens.css` بدل القيم العشوائية.
- حافظ على حالات التحميل والفراغ والخطأ، وعلى التنقل بلوحة المفاتيح.
- لا تفترض قائمة فئات ثابتة؛ الفئات مشتقة من فهرس المقالات.

## Pull Requests

في وصف Pull Request، اشرح المشكلة، وما الذي تغيّر، وكيف تحققت من النتيجة. اربط بالـ Issue عند وجودها، وأرفق لقطات شاشة عندما يتغير الشكل أو السلوك المرئي.

قبل الإرسال، شغّل:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

إذا كان التغيير متعلقًا بالواجهة، اختبره على شاشة صغيرة وسطح مكتب، وتحقق من التركيز ولوحة المفاتيح. إذا كان متعلقًا بالمحتوى، راجع الروابط والمصادر واتجاه النص.

## المراجعة

نراجع دقة المحتوى وسلامة مصادره، ثم صحة الكود، وإمكانية الوصول، والأداء، وحجم الحزمة. الملاحظات موجهة إلى التغيير لا إلى صاحبه، وتهدف إلى إبقاء أثر واضحًا وسهل الصيانة.

## Contributing in English

Athar is an Arabic-first project, but contributors may use English for issues, pull requests, code, and technical discussions. Keep user-facing product copy and article content in clear Arabic unless the change specifically adds translation support.

### Before you start

- Search existing issues before opening a new one.
- Open an issue before implementing a large change.
- Keep each pull request focused on one goal.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

### Local development

Use Node.js 26 or newer:

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm test
npm run build
```

Use `npm run article:editor` to create an article locally. Review the preview and check the generated module and `src/data/registry.ts` entry before submitting it.

### Article contributions

Start with `src/articles/_template.ts` or the local editor. Use a unique lowercase English slug with hyphens, such as `prophet-muhammad-birth`. Include a concise summary, category, tags, realistic reading time, direct sources, and descriptive image alt text. Use `h2` followed by `h3` headings so the table of contents works correctly.

### Pull requests

Explain the problem, the change, and how you verified it. Link the related issue when applicable, include screenshots for visible changes, and list sources for historical content. Preserve RTL support, keyboard navigation, semantic HTML, hash routes, and lazy article loading.

For security reports, follow [SECURITY.md](SECURITY.md) and do not use a public issue for sensitive information.
