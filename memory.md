## Fixes Applied

### 1. Removed deprecated ViewTransitions

- **File**: `src/components/meta.astro`
- **Change**: Removed `ViewTransitions` import and component
- **Reason**: `ViewTransitions` is deprecated in newer Astro versions (ts(6385))

### 2. Fixed embed element TypeScript errors

- **File**: `src/pages/posts/[slug].astro`
- **Change**: Replaced `<embed type="image/svg+xml" data={...}>` with simple `<img src={...}>`
- **Reason**: `data` attribute not in `EmbedHTMLAttributes` type; malformed syntax caused `')' expected` error
- **Note**: `<img>` supports SVG natively, no functionality lost

### 3. Fixed giscus not loading

- **File**: `src/components/post/post-content.astro`
- **Change**: Replaced `document.addEventListener('astro:page-load', loadGiscus)` with direct `loadGiscus()` call
- **Reason**: `astro:page-load` event requires ViewTransitions; after removing it, giscus script never fired

### 4. Styled KaTeX to match Linux Libertine font

- **File**: `src/styles/global.css`
- **Change**: Added KaTeX font overrides with `.katex` selectors
- **Reason**: Default KaTeX uses Computer Modern; overridden to use Linux Libertine for consistency
- **Note**: `font-size: 1em` matches body text perfectly; Computer Modern kept as fallback for math symbols Libertine doesn't support
