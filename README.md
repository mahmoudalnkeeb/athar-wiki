# أثر — A Piece of History

[![CI](https://github.com/mahmoudalnkeeb/athar-wiki/actions/workflows/ci.yml/badge.svg)](https://github.com/mahmoudalnkeeb/athar-wiki/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## English

Athar is an open Arabic-first wiki about Islamic history. It is a lightweight static site that lazy-loads articles, works well on slow connections, and can run without a dedicated server.

The repository currently includes one sourced article. Contributors can add research-backed articles, improve the interface, or work on the local publishing tools. See the [English contribution guide](CONTRIBUTING.md#contributing-in-english).

Requires Node.js 26 or newer. Quick start:

```bash
npm install
npm run dev
```

Run `npm test`, `npm run lint`, `npm run format:check`, and `npm run build` before opening a pull request. Historical additions must include direct, verifiable sources.

أثر موسوعة عربية مفتوحة عن التاريخ الإسلامي. تعرض المقالات في واجهة ثابتة خفيفة، وتحمّل كل مقال عند الطلب، لذلك تبقى مناسبة للاتصالات الضعيفة وتعمل دون خادم خاص.

المحتوى عربي أولًا، والمنتج مبني ليكون سهل القراءة وسهل الإضافة في الوقت نفسه. يضم المستودع حاليًا مقالًا موثقًا، ويمكن للمساهمين إضافة مقالات جديدة أو تحسين الواجهة وأدوات النشر.

## ما الذي يقدمه المشروع؟

- تصفح وبحث عبر hash routes، من دون حاجة إلى إعداد خادم أو rewrites.
- تحميل كسول للمقالات حتى لا يدفع القارئ تكلفة المحتوى الذي لم يفتحه.
- دعم RTL وواجهة مناسبة للهواتف ولوحة المفاتيح.
- محرر مقالات محلي يحوّل التنسيق الغني إلى وحدة TypeScript.
- بناء ثابت يمكن نشره على Netlify أو أي استضافة ملفات ثابتة.
- توليد `sitemap.xml` و`robots.txt` من فهرس المقالات.

## البدء

يتطلب المشروع Node.js 26 أو أحدث.

```bash
npm install
npm run dev
```

افتح العنوان الذي يعرضه Vite، ثم استخدم `#/` للتصفح.

## الأوامر

| الأمر                                        | الغرض                                            |
| -------------------------------------------- | ------------------------------------------------ |
| `npm run dev`                                | تشغيل الموقع في وضع التطوير                      |
| `npm run build`                              | فحص TypeScript وبناء نسخة الإنتاج                |
| `npm run typecheck`                          | فحص الأنواع فقط                                  |
| `npm run lint`                               | فحص الكود باستخدام Oxlint                        |
| `npm run format:check`                       | التحقق من تنسيق الملفات باستخدام Prettier        |
| `npm test`                                   | تشغيل اختبارات الأدوات المحلية                   |
| `npm run preview`                            | معاينة نسخة الإنتاج محليًا                       |
| `npm run article:editor`                     | تشغيل محرر المقالات المحلي                       |
| `npm run sitemap`                            | توليد `public/sitemap.xml` محليًا                |
| `SITE_URL=https://example.com npm run build` | بناء نسخة بروابط الموقع الفعلية وتوليد ملفات SEO |

## إضافة مقال

لإضافة مقال يدويًا، انسخ `src/articles/_template.ts`، ثم أضف بيانات المقال واستيراده الكسول إلى `src/data/registry.ts`.

يمكنك بدلًا من ذلك تشغيل المحرر المحلي:

```bash
npm run article:editor
```

ثم افتح [http://127.0.0.1:4317](http://127.0.0.1:4317). يكتب المحرر الملف الجديد ويضيفه إلى الفهرس. يعمل محليًا فقط، ويحفظ المسودة تلقائيًا في `localStorage` داخل المتصفح.

يستخدم المحرر HTML دلاليًا خفيفًا داخل دالة `render()`. استخدم `h2` و`h3` لبناء جدول المحتويات، وأدرج المصادر بصيغة `العنوان | https://example.com`، وأضف وصفًا بديلًا لكل صورة.

كل معلومة تاريخية جديدة تحتاج إلى مصدر قابل للتحقق. راجع [دليل المساهمة](CONTRIBUTING.md) قبل فتح Pull Request.

## بنية المشروع

```text
src/articles/       مقالات محمّلة عند الطلب وقالب المقال
src/components/     مكونات الواجهة
src/data/            هوية أثر وفهرس المقالات وأنواع البيانات
src/lib/             التحميل والتوجيه وأدوات DOM
src/styles/          tokens وأنماط الواجهة
scripts/             محرر المقالات واختباراته وتوليد sitemap
public/              الشعار وملفات الاستضافة الثابتة
```

## النشر

يستخدم المشروع `netlify.toml` للبناء عبر `npm run build` ونشر مجلد `dist`. اضبط متغير البيئة `SITE_URL` في إعدادات الاستضافة، مثل `https://your-site.netlify.app`، كي تتولد ملفات `sitemap.xml` و`robots.txt` بالروابط الصحيحة.

يمكن نشر مجلد `dist` الناتج على أي استضافة ملفات ثابتة تدعم تشغيل تطبيقات المتصفح. لا يحتاج router إلى إعداد rewrites لأن المسارات مبنية على hash.

## المساهمة

نرحب بالمقالات والتحسينات التي تزيد الدقة والوضوح وإمكانية الوصول. ابدأ بقراءة [CONTRIBUTING.md](CONTRIBUTING.md)، واستخدم قوالب Issues وPull Requests الموجودة في المستودع.

للبلاغات الأمنية، اتبع [سياسة الأمان](SECURITY.md). وللمعايير البصرية والتفاعلية، راجع [DESIGN.md](DESIGN.md).

## الترخيص

هذا المشروع متاح تحت [ترخيص MIT](LICENSE).
