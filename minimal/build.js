#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontMatter: {}, content };

  const frontMatter = {};
  match[1].split("\n").forEach((line) => {
    const [key, ...values] = line.split(":");
    if (key && values.length) {
      let value = values.join(":").trim();
      value = value.replace(/^["']|["']$/g, "");
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/["']/g, ""));
      }
      frontMatter[key.trim()] = value;
    }
  });

  return { frontMatter, content: match[2] };
}

function extractSVGs(md, slug, outputDir, publicDir) {
  const svgRegex = /<svg([\s\S]*?)<\/svg>/g;
  let match;
  const svgs = [];
  let index = 0;

  while ((match = svgRegex.exec(md)) !== null) {
    const svgContent = match[0];
    const svgId = `${slug}-figure-${index}`;
    const svgFilename = `${svgId}.svg`;

    // Clean JSX from SVG
    let cleanSvg = svgContent;
    cleanSvg = cleanSvg.replace(/\{`([\s\S]*?)`\}/g, "$1");
    cleanSvg = cleanSvg.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    cleanSvg = cleanSvg.replace(/\{\/[\s\S]*?\/\}/g, "");
    cleanSvg = cleanSvg.replace(/style=\{\{[^}]*\}\}/g, 'style=""');
    cleanSvg = cleanSvg.replace(/className="/g, 'class="');

    // Ensure SVG has xmlns attribute
    if (!cleanSvg.includes("xmlns=")) {
      cleanSvg = cleanSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Save to public directory
    fs.writeFileSync(path.join(publicDir, svgFilename), cleanSvg);

    svgs.push({
      original: match[0],
      placeholder: `<img src="../public/${svgFilename}" alt="Figure ${index + 1}" class="svg-figure" loading="lazy">`,
      filename: svgFilename,
    });

    index++;
  }

  return svgs;
}

function markdownToHtml(md, relativePathPrefix = "..") {
  const lines = md.split("\n");
  const result = [];
  let inDisplayMath = false;
  let mathContent = [];
  const allInlineMath = [];
  const allDisplayMath = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "$$") {
      if (inDisplayMath) {
        const mathIdx = allDisplayMath.length;
        allDisplayMath.push(mathContent.join("\n"));
        result.push(`%%DISPLAYMATH_${mathIdx}%%`);
        mathContent = [];
        inDisplayMath = false;
      } else {
        inDisplayMath = true;
        mathContent = [];
      }
      continue;
    }

    if (inDisplayMath) {
      mathContent.push(line);
      continue;
    }

    let processedLine = line;
    const inlineMathMatches = [];
    let match;
    const inlineRegex = /\$([^\n$]+)\$/g;
    while ((match = inlineRegex.exec(line)) !== null) {
      inlineMathMatches.push({ full: match[0], math: match[1], index: match.index });
    }

    for (let j = inlineMathMatches.length - 1; j >= 0; j--) {
      const m = inlineMathMatches[j];
      const globalIdx = allInlineMath.length;
      allInlineMath.push(m);
      processedLine =
        processedLine.substring(0, m.index) +
        `%%INLINE_${globalIdx}%%` +
        processedLine.substring(m.index + m.full.length);
    }

    result.push(processedLine);
  }

  let html = result.join("\n");

  // Process markdown in CORRECT ORDER

  // 1. Lists FIRST (before italic/bold to avoid conflicts)
  html = html.replace(/^\- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^\* (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, "<ul>$&</ul>");

  // 2. Code blocks
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (match, lang, code) => `<pre><code class="language-${lang}">${code.trim()}</code></pre>`,
  );

  // 3. Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 4. Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // 4b. Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // 5. Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // 6. Bold (before italic)
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 7. Italic - but NOT for list items (asterisk followed by space)
  html = html.replace(/\*(?!\s)([^*]+)\*/g, "<em>$1</em>");

  // 8. Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 9. Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Wrap ONLY Plotly iframes in click-to-load containers
  // Detect Plotly by: title contains "Plotly" OR src ends with "3d.html"
  html = html.replace(/<iframe\s*([\s\S]*?)>([\s\S]*?)<\/iframe>/g, (match, attrs, content) => {
    const isPlotly = attrs.includes("Plotly") || attrs.includes("3d.html");

    if (!isPlotly) {
      // YouTube and others load normally (paths will be fixed later)
      return `<iframe ${attrs}>${content}</iframe>`;
    }

    // Fix paths in attrs first
    const fixedAttrs = attrs.replace(/src="\/([^"]+)"/g, `src="${relativePathPrefix}/public/$1"`);
    const cleanAttrs = fixedAttrs.replace(/"/g, "&quot;").replace(/\s+/g, " ").trim();

    return `<div class="iframe-placeholder" onclick="this.outerHTML='<iframe ${cleanAttrs}</iframe>'"><div class="load-btn">📊 Load Interactive Plot</div></div>`;
  });

  // Restore math
  html = html.replace(/%%INLINE_(\d+)%%/g, (match, idx) => {
    const originalMatch = allInlineMath[idx];
    return originalMatch ? `$${originalMatch.math}$` : match;
  });

  html = html.replace(/%%DISPLAYMATH_(\d+)%%/g, (match, idx) => {
    const math = allDisplayMath[idx];
    return math ? `$$${math}$$` : match;
  });

  const blockElements = [
    "<h1>",
    "<h2>",
    "<h3>",
    "<h4>",
    "<h5>",
    "<h6>",
    "<pre>",
    "<ul>",
    "<ol>",
    "<blockquote>",
    "<table>",
    "<div>",
    "<img>",
    "<figure>",
    "<iframe>",
    "<figcaption>",
    "<center>",
    "<br>",
    "<hr>",
    "<li>",
  ];

  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return "";
      for (const el of blockElements) {
        if (p.startsWith(el)) return p;
      }
      if (p.match(/^\$\$/)) return p;

      // Convert list items within paragraphs
      p = p.replace(/^\* (.+)$/gm, "<li>$1</li>");
      p = p.replace(/^\- (.+)$/gm, "<li>$1</li>");
      if (p.includes("<li>")) {
        p = p.replace(/(<li>[\s\S]*?<\/li>)+/g, "<ul>$&</ul>");
        return p;
      }

      return `<p>${p}</p>`;
    })
    .join("");

  // Merge consecutive <ul> tags
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // Fix absolute paths
  if (relativePathPrefix) {
    html = html.replace(/(src|href)="\/([^"]+)"/g, `$1="${relativePathPrefix}/public/$2"`);
  }

  return html;
}

function generatePostHTML(frontMatter, content, relativePathPrefix = "..") {
  const tagsHtml = (frontMatter.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("");
  const coverHtml = frontMatter.cover
    ? `<img src="${relativePathPrefix}/public${frontMatter.cover}" alt="cover" class="post-cover" loading="lazy">`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${frontMatter.description || ""}">
  <title>${frontMatter.title} · Bogdan K. Jastrzębski</title>
  <link rel="icon" type="image/png" href="${relativePathPrefix}/public/favicon.png">
  <link rel="stylesheet" href="${relativePathPrefix}/styles.css?v=12">
  
  <!-- KaTeX - same as original site -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.cdnfonts.com/css/linux-libertine" rel="stylesheet">
  
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\\\(', right: '\\\\)', display: false},
          {left: '\\\\[', right: '\\\\]', display: true}
        ],
        macros: {
          "\\\\coloneq": ":="
        },
        throwOnError: false
      });
    });
  </script>
</head>
<body>
  <header>
    <div class="header-inner">
      <a href="${relativePathPrefix}/" class="logo">
        <img src="${relativePathPrefix}/public/avatar.png" alt="avatar">
        <span>Bogdan K. Jastrzębski</span>
      </a>
      <nav>
        <a href="${relativePathPrefix}/posts.html">Articles</a>
        <a href="https://github.com/bogdankjastrzebski" target="_blank">GitHub</a>
        <a href="${relativePathPrefix}/about.html">About</a>
      </nav>
    </div>
  </header>
  <main>
    <article class="post-header">
      <h1>${frontMatter.title}</h1>
      <div class="meta">
        <span class="date">${frontMatter.date}</span>
        ${tagsHtml}
      </div>
      <p>${frontMatter.description || ""}</p>
      ${coverHtml}
    </article>
    <div class="post-content">${content}</div>
    <div id="giscus-container"></div>
  </main>
  <footer><p>© 2025 Bogdan K. Jastrzębski</p></footer>
  <script>
    function loadGiscus() {
      const container = document.getElementById('giscus-container');
      if (!container) return;
      container.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.setAttribute('data-repo', 'bogdankjastrzebski/bogdankjastrzebski.github.io');
      script.setAttribute('data-repo-id', 'R_kgDOOJAeng');
      script.setAttribute('data-category', 'Announcements');
      script.setAttribute('data-category-id', 'DIC_kwDOOJAens4CoHTe');
      script.setAttribute('data-mapping', 'pathname');
      script.setAttribute('data-strict', '0');
      script.setAttribute('data-reactions-enabled', '0');
      script.setAttribute('data-emit-metadata', '0');
      script.setAttribute('data-input-position', 'top');
      script.setAttribute('data-theme', 'https://bogdankjastrzebski.github.io/css/comments.css');
      script.setAttribute('data-lang', 'en');
      script.setAttribute('crossorigin', 'anonymous');
      script.async = true;
      container.appendChild(script);
    }
    loadGiscus();
    
    // Image loading handler - hide broken images and show loaded ones
    document.addEventListener('DOMContentLoaded', () => {
      const images = document.querySelectorAll('.post-content img');
      images.forEach(img => {
        // Mark as loaded immediately if already loaded
        if (img.complete) {
          img.classList.add('loaded');
        } else {
          img.addEventListener('load', () => img.classList.add('loaded'));
          img.addEventListener('error', () => {
            img.classList.add('loaded');
            img.style.display = 'none';
          });
        }
        // Remove alt text display during loading
        img.setAttribute('alt', '');
      });
    });
    
    // Auto-hide header on scroll
    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        header.classList.add('header-hidden');
      } else {
        header.classList.remove('header-hidden');
      }
      
      lastScrollY = currentScrollY;
    }, { passive: true });
  </script>
</body>
</html>`;
}

// Main
const blogDir = path.join(__dirname, "content", "blog");
const outputDir = path.join(__dirname, "posts");
const publicDir = path.join(__dirname, "public");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Copy public assets from main project
const mainPublicDir = path.join(__dirname, "..", "public");
if (fs.existsSync(mainPublicDir)) {
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) copyDir(srcPath, destPath);
      else {
        const stats = fs.statSync(srcPath);
        if (stats.size > 5 * 1024 * 1024) continue;
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyDir(mainPublicDir, publicDir);
}

const posts = [];
const files = fs.readdirSync(blogDir);

files.forEach((file) => {
  if (!file.endsWith(".mdx")) return;
  const filePath = path.join(blogDir, file);
  const content = fs.readFileSync(filePath, "utf-8");
  const { frontMatter, content: mdContent } = parseFrontMatter(content);
  const slug = file.replace(".mdx", "");

  // Extract SVGs to separate files
  const svgs = extractSVGs(mdContent, slug, outputDir, publicDir);

  // Replace SVGs with img tags
  let processedContent = mdContent;
  svgs.forEach((svg) => {
    processedContent = processedContent.replace(svg.original, svg.placeholder);
  });

  const htmlContent = markdownToHtml(processedContent, "..");

  const postHTML = generatePostHTML(frontMatter, htmlContent, "..");
  fs.writeFileSync(path.join(outputDir, `${slug}.html`), postHTML);

  posts.push({
    slug,
    title: frontMatter.title || slug,
    description: frontMatter.description || "",
    date: frontMatter.date || "",
    tags: frontMatter.tags || [],
    cover: frontMatter.cover || "",
  });

  console.log(`✓ Generated ${slug}.html (${svgs.length} SVGs extracted)`);
});

posts.sort((a, b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(path.join(__dirname, "posts-data.js"), `const postsData = ${JSON.stringify(posts, null, 2)};\n`);
console.log("✓ Generated posts-data.js\nBuild complete! 🎉");
