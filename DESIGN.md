# أثر design standards

This document is the shared visual and interaction contract for أثر, an Arabic-first historical reference publication. It describes the design language already used by the application and the rules new pages and components should follow.

## Design direction

أثر should feel scholarly, calm, editorial, and useful before it feels decorative. The interface uses a manuscript-inspired light surface, deep forest emerald for identity and action, antique brass for restrained emphasis, and cool ink neutrals for readable body copy.

The design read is: a preserved Arabic editorial reference site for readers and researchers, using native CSS, semantic HTML, and restrained interaction.

Design dials:

- `DESIGN_VARIANCE`: 5. The layout may use editorial asymmetry, but it should remain easy to scan.
- `MOTION_INTENSITY`: 3. Motion is limited to feedback and state transitions.
- `VISUAL_DENSITY`: 3. Content has room to breathe, without leaving accidental empty areas.

Preserve the following at all times:

- the أثر logo and Arabic-first copy voice
- RTL direction and the existing hash routes
- the current article registry and dynamic category data
- the emerald, ivory, brass, and ink palette
- lazy article loading and offline-friendly behavior
- visible focus states and keyboard navigation

## Information architecture

The current route map is intentionally small:

| Route              | Purpose          | Primary composition                                             |
| ------------------ | ---------------- | --------------------------------------------------------------- |
| `#/`               | Homepage         | Hero, search, featured article, latest articles                 |
| `#/wiki`           | All articles     | Page lead, compact two-column card grid revealed in batches     |
| `#/category/:name` | Category listing | Page lead, compact card grid revealed in batches when needed    |
| `#/search?q=...`   | Search results   | Page lead, compact card grid revealed in batches when needed    |
| `#/wiki/:slug`     | Article          | Breadcrumbs, article header, contents, readable article measure |
| unknown route      | Not found        | Focused status state and recovery actions                       |

Do not add navigation labels or routes unless the router and a real destination exist.

## Layout system

### Shared shell

- The content shell is centered with a maximum width of `1240px`.
- Desktop uses a `248px` right navigation rail, a `24px` grid gap, and a flexible main column. Article pages increase the gap to `40px` for reading separation.
- The sidebar is on the right in RTL layouts. The main content is on the left.
- The shell uses the existing spacing tokens. Do not align content with arbitrary offsets.
- Header, shell, hero, page leads, article cards, and footer should share the same outer edges.

### Responsive rules

- Below `1200px`, the shell becomes one column and the sidebar becomes a full-screen right-to-left navigation layer. This keeps tablets in a stable single reading flow.
- At `480px` and below, use the compact mark logo, hide the desktop descriptor, and keep page padding efficient.
- At `375px` and below, use the tighter hero rhythm for narrow phones.
- At `400px` to `480px`, use `20px` page padding when space allows.
- Test at `320px`, `360px`, `375px`, `390px`, `412px`, `430px`, `768px`, `1024px`, `1440px`, and `1920px`.
- Never allow a fixed desktop column or sidebar gap to survive on mobile.
- Multi-column content collapses to one column on mobile. Do not rely on accidental flex wrapping.

## Token contract

Use semantic tokens from `src/styles/tokens.css` instead of raw values in components.

### Color roles

| Role            | Token                   | Use                                  |
| --------------- | ----------------------- | ------------------------------------ |
| Page background | `--color-bg`            | Global canvas                        |
| Subtle paper    | `--color-bg-subtle`     | Hero, page leads, quiet surfaces     |
| Raised surface  | `--color-surface`       | Cards, inputs, article controls      |
| Primary         | `--color-primary`       | Main actions and strong controls     |
| Primary hover   | `--color-primary-hover` | Hover feedback                       |
| Heading ink     | `--color-text-heading`  | Headings and brand text              |
| Body ink        | `--color-text`          | Main readable copy                   |
| Muted ink       | `--color-text-muted`    | Metadata and secondary copy only     |
| Link            | `--color-link`          | Navigational and article links       |
| Brass accent    | `--color-accent`        | Dividers and small editorial details |
| Focus           | `--color-focus`         | Keyboard focus rings                 |

Do not introduce gradients, neon accents, heavy shadows, or a second accent family. Brass should clarify structure, not outline every element.

### Typography

- Display headings use `--font-display`, currently Amiri with the existing fallback stack.
- Body and controls use `--font-body`, currently Tajawal with the existing fallback stack.
- Keep Arabic body copy at `--leading-normal` or `--leading-relaxed` unless a specific compact metadata treatment needs less.
- Use the heading hierarchy semantically: one `h1` per page, `h2` for sections, and `h3` for article cards or subsections.
- Use `--text-xs` and `--text-sm` for metadata, not for essential explanations.
- Avoid excessive bold weights. Use alignment, spacing, and surface contrast to create hierarchy.

### Spacing and shape

Use the existing 4px rhythm:

`--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-6`, `--space-8`, `--space-10`, `--space-12`, `--space-16`.

The normal composition rhythm is:

- `8px` for metadata relationships
- `16px` for component gaps and card padding
- `24px` for section internals and shell gaps
- `32px` for editorial breathing room
- `48px` for major section transitions

Use the existing radius family consistently:

- `--radius-sm` for controls, navigation rows, and badges
- `--radius-md` for article cards, page leads, and inputs
- `--radius-lg` for the homepage hero
- `--radius-arch` only for intentional arch geometry

Do not make every control pill-shaped or add a new radius ad hoc.

## Shared page patterns

### Header and masthead

- Desktop header height is approximately `72px` and never exceeds `80px`.
- Mobile header height is approximately `60px`.
- On the desktop homepage (`#/`), the normal masthead is omitted; the hero owns the visible أثر logo and primary search. Internal desktop routes retain the masthead. Tablet/mobile retain the compact masthead on every route because it owns navigation.
- Keep the logo on the natural RTL brand side and use the compact mark below `480px`.
- Keep the compact desktop search available on internal pages. On the homepage, hide it while the hero search is present so the two fields do not compete. On mobile, expose search inside the navigation drawer and prioritize the homepage search.
- The menu trigger is a real button with `aria-expanded`, `aria-controls`, and a visible focus ring.
- The brass divider under the masthead is a single structural accent, not a decorative band.

### Hero

The homepage hero is a compact editorial introduction, not a full-screen landing panel.

On desktop, the hero contains the actual أثر wordmark/logo as its brand mark while retaining one semantic `h1`. The desktop homepage has no separate masthead above the shared shell.

It contains, in order:

1. Brand slogan or kicker
2. أثر title
3. Short brand description
4. Primary search field
5. Existing article count and scope metadata

Desktop target height is approximately `300px` to `340px`. Mobile uses natural height with tighter `24px` to `32px` vertical padding. Search is full width on mobile, at least `48px` high, and visually stronger than supporting metadata.

### Page leads

All listing routes use `.list-header` as their page lead. Keep the title, optional subtitle, and count in one warm paper surface with the same restrained corner treatment used by article headers. A single result uses the featured editorial card so it does not float as a narrow isolated card.

### Article cards

Use the existing `wikiCard` and `wikiFeaturedCard` renderers.

- A featured or only article uses the horizontal editorial card on desktop.
- The homepage shows one featured article followed by at most six latest articles.
- Remaining latest or listing results use a compact two-column grid on desktop.
- Listing routes reveal twelve articles at a time so large catalogues remain scannable.
- All article cards become one column on mobile.
- At the sub-`1200px` tablet/mobile breakpoint, featured cards use explicit single-column rows: the visual spans the full card width, followed by the content. The visual height is fluid (`180px`–`210px`) and must not be constrained by an aspect-ratio/max-height combination that narrows it.
- Metadata comes only from the registry: category, date, reading time, and tags when available.
- A missing image uses a typography-first card. Card structure comes from its surface and spacing; do not add a floating decorative bar above the card. Never reserve a large placeholder panel, invent a remote image URL, or fake article data.
- The entire card link must remain keyboard focusable with a visible focus ring.

### Article reading page

- Breadcrumbs establish context before the article header.
- The article header is a calm surface containing category, date, reading time, title, summary, and review metadata when available.
- Contents are grouped in a quiet surface and remain keyboard navigable.
- Article body copy uses a controlled reading measure and generous Arabic line-height.
- The article reading column uses `--article-reading-max` (`44rem`) on desktop; the article header may remain wider than the prose.
- Heading rules, lead paragraphs, callouts, sources, and action buttons should use the same tokens as the shell.
- Large desktop uses the existing sidebar as one cohesive sticky wrapper containing global links, the current category, and the dynamic article TOC. Sidebar children are never independently sticky.
- Long desktop TOCs remain readable in normal document flow and should not introduce an independent scroll container inside the navigation rail.
- The large-desktop main-column TOC is hidden to avoid duplication. Below `1200px`, the sidebar returns to the global drawer and the main TOC appears as a static disclosure in normal document flow.
- Article TOCs use stable route-aware heading anchors. Short TOCs default expanded; long TOCs may default collapsed.
- A two-pixel reading-progress rule is attached inside the sticky header on article pages, using a lightweight requestAnimationFrame update. It is based on the article content range and reaches `100%` at document end.
- Only the site header and, on large desktop, the whole sidebar wrapper may use sticky positioning. Search and main-column TOCs remain static children of their layout.
- Do not widen article prose merely to fill the desktop viewport. Reading comfort is the priority.
- Lead paragraphs use a softened quiet emerald surface mixed with the page background and restrained corner accents; they should support the opening rather than become a dominant panel. Callouts preserve their semantic accent color while using the same corner language.

### Sidebar and mobile drawer

- Desktop sidebar is a navigation rail, not a floating dashboard card.
- Active navigation uses a subtle emerald surface and restrained brass corner accents: a small upper-start corner and lower-end corner. Avoid solid vertical indicator bars.
- Categories are rendered from `getCategories()` and must remain dynamic.
- Article routes replace the full desktop category list with the current category and a dynamic `في هذا المقال` group. A lightweight requestAnimationFrame-throttled scroll position check updates the active section and explicitly activates the final heading at document end.
- The mobile sidebar is a full-screen navigation layer with a warm surface, a right-to-left entrance transition, backdrop, internal close button, focus management, Escape support, and background scroll lock.
- Closing the drawer after navigation is required.
- About text belongs in a titled `عن أثر` block when it is present; on the homepage it should not be repeated across the hero, rail, and footer.

### Loading, empty, error, and not-found states

States should keep the same page shell, typography, action geometry, and recovery patterns as content pages.

- Loading uses the existing skeleton lines and a useful status label.
- Empty results explain what happened and provide a route back to relevant content.
- Errors expose a clear recovery action and preserve the existing offline behavior.
- Not-found states use the same primary and ghost action styles as the article footer.
- Do not reserve a large blank area when there is no content.

## Interaction and accessibility

- Use semantic `header`, `nav`, `main`, `aside`, `section`, `article`, `form` or `role="search"`, and heading elements.
- Every search input has a programmatic label. Do not use placeholder text as the only label.
- Every icon-only control has an accessible label.
- Interactive targets should be at least `44px` high and wide where practical.
- Use `:focus-visible` with the focus token. Never remove outlines without a stronger replacement.
- Keep card interactions on one link. Do not nest buttons or links inside card links.
- Use `120ms` to `220ms` transitions from the existing duration tokens.
- Animate only feedback or state changes. Respect `prefers-reduced-motion`.
- Preserve URL-driven search and route state. Do not replace it with local-only UI state.

## Content and data rules

- Articles, categories, counts, dates, reading times, tags, and scope copy come from the existing data model or brand data.
- Never hardcode a category list to improve visual density.
- Never fabricate reading times, article counts, imagery, citations, authors, or routes.
- Preserve Arabic copy unless a content correction is explicitly required.
- Keep metadata concise. Use at most one visual separator per metadata line where possible.
- Avoid decorative symbols when an existing icon or plain text can communicate the same thing.

## Implementation rules

- Prefer existing renderers and CSS classes over duplicate markup.
- Keep visual styles in `src/components/components.css`, global behavior in `src/styles/global.css`, patterns in `src/styles/patterns.css`, and semantic values in `src/styles/tokens.css`.
- Do not add a dependency for a small visual or interaction detail.
- Lucide is the existing icon family. Continue using it consistently unless the project intentionally migrates the entire icon system.
- Use CSS logical properties such as `margin-inline`, `padding-block`, and `inset-inline` so RTL remains correct.
- Use `min-width: 0` in flexible/grid children that contain long Arabic text.
- Reserve image dimensions to prevent layout shift and lazy-load imagery below the fold.
- Keep business logic in the router, registry, loader, and app layers. Components should render and enhance their own markup.

## Review checklist

Before shipping a page or shared component, verify:

- The page uses the shared shell and aligns to the `1240px` content frame.
- The right sidebar disappears into the accessible drawer below `1200px`.
- The page has no horizontal overflow at the six target phone widths.
- A single result uses a full-width editorial treatment.
- Long Arabic titles, names, categories, dates, and mixed-direction strings do not clip.
- Empty, loading, error, and not-found states remain compact and actionable.
- Search, navigation, cards, contents links, and article actions work with keyboard input.
- Focus states are visible and touch targets are comfortable.
- Colors, radii, spacing, and typography come from the established tokens.
- No fake content, unsupported route, gradient, heavy shadow, or unrelated redesign was introduced.
- `npm run typecheck`, `npm test`, and `npm run build` pass.
- Representative routes are reviewed at desktop, tablet, and mobile sizes using the interactive browser workflow.
