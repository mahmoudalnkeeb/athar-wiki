/**
 * Article Template: قالب مقال جديد
 *
 * 1. انسخ هذا الملف إلى: src/articles/my-slug.ts
 * 2. غيّر الحقول أدناه
 * 3. سجّل المقال في src/data/registry.ts:
 *      { slug: "my-slug", title: "...", summary: "...", category: "...", load: () => import("../articles/my-slug.ts") }
 *
 * NOTE: This file is lazy-loaded — it becomes its own JS chunk.
 * Keep it light: avoid importing heavy libraries. Prefer plain HTML string.
 */

import { defineArticle } from '../data/types.ts'

export default defineArticle({
  slug: 'example-article',
  title: 'عنوان المقال هنا',
  summary: 'ملخص قصير من جملة أو اثنتين يظهر في البطاقات والبحث. لا يتجاوز ١٤٠ حرفًا.',
  category: 'تصنيف عام',
  tags: ['كلمة', 'مفتاحية'],
  date: '2026-08-28',
  readingTime: 4,
  // cover: "/images/example-cover-400w.webp", // optional, lazy-loaded
  // author: "اسم الكاتب",

  render() {
    // Return an HTML string for the smallest bundle.
    // Use semantic headings (h2/h3). The TOC is generated from them.
    // For images: use <img data-src="..." loading="lazy" width height>. The loader handles them.
    // For heavy sections: wrap in <div data-lazy-section> if you later add intersection observers.
    return `
      <div class="wiki-article">
        <p class="lead">فقرة افتتاحية. تعريف موجز بالموضوع وأهميته.</p>

        <h2 id="muqadima">مقدمة</h2>
        <p>نص المقدمة هنا. استخدم لغة واضحة ومباشرة، مع فقرات قصيرة لسهولة القراءة على الهاتف.</p>

        <div class="callout callout--info">
          <strong>معلومة:</strong> استخدم مربعات التنبيه لإبراز النقاط المهمة دون إثقال الصفحة.
        </div>

        <h2 id="siyaq">السياق التاريخي</h2>
        <p>محتوى القسم الثاني…</p>

        <h3 id="tafsil">تفصيل فرعي</h3>
        <p>تفصيل إضافي تحت العنوان الفرعي.</p>

        <figure class="wiki-figure">
          <img
            data-src="/images/placeholder-600w.webp"
            alt="وصف الصورة. مهم لإمكانية الوصول."
            width="600" height="400"
            loading="lazy"
            decoding="async"
          />
          <figcaption>تعليق الصورة. اذكر مصدرها وتاريخها إن وجد.</figcaption>
        </figure>

        <h2 id="masadir">المصادر</h2>
        <ul>
          <li>مصدر ١: <a href="#">رابط</a></li>
          <li>مصدر ٢</li>
        </ul>
      </div>
    `
  },
})
