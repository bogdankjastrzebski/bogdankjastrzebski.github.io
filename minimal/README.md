# Minimal Website

A lightweight, pure HTML/CSS/JS version of the website - no Astro, no bloat!

## Features

- ✅ Pure HTML/CSS/JavaScript
- ✅ MathJax for math equations
- ✅ Linux Libertine fonts
- ✅ Giscus comments
- ✅ Responsive design
- ✅ Blurry translucent top bar
- ✅ Post listing with tags and dates
- ✅ Auto-generated from MDX files

## Quick Start

```bash
# Build the site from MDX files
node build.js

# Serve locally (any static server works)
npx serve ..
# or
python -m http.server 8000
```

## Structure

```
minimal/
├── index.html          # Homepage
├── posts.html          # All posts page
├── about.html          # About page
├── styles.css          # All styles
├── posts-data.js       # Auto-generated post metadata
├── build.js            # Build script (MDX → HTML)
└── posts/              # Individual post pages
    ├── astar.html
    ├── derandomization.html
    └── ...
```

## Customization

### Update posts

Just edit the MDX files in `../src/content/blog/` and run `node build.js`

### Change styles

Edit `styles.css` - it's all in one file, no Tailwind needed!

### Math support

Use `$...$` for inline math and `$$...$$` for display math. MathJax handles the rest!

## Why this exists

Because sometimes you don't need a build system, bundler, or framework. Just HTML.
