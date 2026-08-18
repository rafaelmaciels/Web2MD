import { ConversionResult, ExtractedPage, UserSettings } from '../types';
import { sanitizeFilename } from './filename';

/**
 * Pure JavaScript HTML to Markdown Converter for React Native & Web
 * Does not depend on browser DOMParser or document globals.
 */
export function htmlToMarkdownPure(html: string, settings: UserSettings, baseUrl?: string): string {
  if (!html) return '';

  let md = html;

  // 1. Remove comments, scripts, styles, noscript
  md = md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  // 2. Pre-formatted Code Blocks <pre><code class="language-xyz">...</code></pre>
  const fence = settings.fence || '```';
  md = md.replace(/<pre[^>]*><code(?:\s+class=["'](?:language-|lang-)?([a-zA-Z0-9_-]+)["'])?[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, lang, code) => {
    const language = (lang || '').toLowerCase();
    const cleanCode = decodeEntities(code.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
    return `\n\n${fence}${language}\n${cleanCode.trim()}\n${fence}\n\n`;
  });

  // Standalone <pre>
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => {
    const cleanCode = decodeEntities(code.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
    return `\n\n${fence}\n${cleanCode.trim()}\n${fence}\n\n`;
  });

  // Inline <code>
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => {
    return ` \`${decodeEntities(code.replace(/<[^>]+>/g, ''))}\` `;
  });

  // 3. Headings H1 - H6
  const headingStyle = settings.headingStyle || 'atx';
  if (headingStyle === 'setext') {
    md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => {
      const clean = cleanInline(text);
      return `\n\n${clean}\n${'='.repeat(Math.max(3, clean.length))}\n\n`;
    });
    md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => {
      const clean = cleanInline(text);
      return `\n\n${clean}\n${'-'.repeat(Math.max(3, clean.length))}\n\n`;
    });
  } else {
    md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n\n# ${cleanInline(text)}\n\n`);
    md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n\n## ${cleanInline(text)}\n\n`);
  }

  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n\n### ${cleanInline(text)}\n\n`);
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, text) => `\n\n#### ${cleanInline(text)}\n\n`);
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, text) => `\n\n##### ${cleanInline(text)}\n\n`);
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, text) => `\n\n###### ${cleanInline(text)}\n\n`);

  // 4. Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => {
    const lines = cleanInline(text).split('\n');
    return `\n\n${lines.map((l) => `> ${l}`).join('\n')}\n\n`;
  });

  // 5. Linked Images: <a href="..."><img src="..." alt="..."></a>
  if (settings.includeImages && settings.includeLinks) {
    md = md.replace(/<a\b([^>]*?)>\s*<img\b([^>]*?)>\s*<\/a>/gi, (_, aAttrs, imgAttrs) => {
      let href = extractAttr(aAttrs, 'href') || '';
      href = resolveAbsoluteUrl(href, baseUrl);

      let src = extractImgSrc(imgAttrs);
      if (!src) return '';
      src = resolveAbsoluteUrl(src, baseUrl);

      let alt = extractAttr(imgAttrs, 'alt') || '';
      alt = cleanInline(alt).replace(/[\[\]]/g, '');

      return `[![${alt}](${src})](${href})`;
    });
  }

  // 6. Standalone Images: <img src="..." alt="...">
  if (settings.includeImages) {
    md = md.replace(/<img\b([^>]*?)>/gi, (_, attrs) => {
      let src = extractImgSrc(attrs);
      if (!src) return '';
      src = resolveAbsoluteUrl(src, baseUrl);

      let alt = extractAttr(attrs, 'alt') || '';
      alt = cleanInline(alt).replace(/[\[\]]/g, '');

      return `![${alt}](${src})`;
    });
  } else {
    md = md.replace(/<img[^>]*>/gi, '');
  }

  // 7. Standalone Hyperlinks: <a href="...">text</a>
  if (settings.includeLinks) {
    md = md.replace(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi, (_, attrs, text) => {
      let href = extractAttr(attrs, 'href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return cleanInline(text);
      }

      href = resolveAbsoluteUrl(href, baseUrl);
      const anchor = cleanInline(text);
      if (!anchor.trim()) return '';
      return `[${anchor}](${href})`;
    });
  } else {
    md = md.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  }

  // 8. Bold, Italic, Strikethrough
  md = md.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
  md = md.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');
  md = md.replace(/<(?:del|s|strike)[^>]*>([\s\S]*?)<\/(?:del|s|strike)>/gi, '~~$1~~');

  // 9. Lists (Ordered and Unordered)
  const marker = settings.bulletListMarker || '-';
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const formatted = items.map((li: string) => {
      const text = cleanInline(li.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1'));
      return `${marker} ${text}`;
    });
    return `\n\n${formatted.join('\n')}\n\n`;
  });

  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const formatted = items.map((li: string, idx: number) => {
      const text = cleanInline(li.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1'));
      return `${idx + 1}. ${text}`;
    });
    return `\n\n${formatted.join('\n')}\n\n`;
  });

  // 10. Tables (GFM)
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    if (rows.length === 0) return '';

    let tableMd = '\n\n';
    let isHeader = true;

    rows.forEach((row: string) => {
      const cells = row.match(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi) || [];
      const cellTexts = cells.map((c: string) =>
        cleanInline(c.replace(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/i, '$1')).replace(/\|/g, '\\|')
      );

      if (cellTexts.length > 0) {
        tableMd += `| ${cellTexts.join(' | ')} |\n`;

        if (isHeader) {
          tableMd += `| ${cellTexts.map(() => '---').join(' | ')} |\n`;
          isHeader = false;
        }
      }
    });

    return tableMd + '\n';
  });

  // 11. Paragraphs, line breaks, HR
  md = md.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');
  md = md.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '\n$1\n');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = decodeEntities(md);

  // Fix any malformed broken bracketed images `[ ![alt](img) ](url)`
  md = md.replace(/\[\s*!\[(.*?)\]\((.*?)\)\s*\]\((.*?)\)/g, '[![$1]($2)]($3)');

  // Normalize excessive newlines
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  return md;
}

export function convertToMarkdown(
  extracted: ExtractedPage,
  settings: UserSettings
): ConversionResult {
  let bodyMarkdown = '';

  if (extracted.selectionText && extracted.selectionText.trim()) {
    bodyMarkdown = extracted.selectionText.trim();
  } else {
    const rawContent = extracted.contentHtml || extracted.textContent || '';
    bodyMarkdown = htmlToMarkdownPure(rawContent, settings, extracted.url);
  }

  // Clean up excess blank lines
  bodyMarkdown = bodyMarkdown.replace(/\n{3,}/g, '\n\n').trim();

  // Generate YAML Frontmatter if enabled
  let finalMarkdown = '';
  if (settings.includeFrontmatter) {
    const meta = extracted.metadata;
    const frontmatterLines = [
      '---',
      `title: ${JSON.stringify(meta.title)}`,
      `url: ${JSON.stringify(meta.url)}`,
      `domain: ${JSON.stringify(meta.domain)}`,
    ];

    if (meta.byline) {
      frontmatterLines.push(`author: ${JSON.stringify(meta.byline)}`);
    }
    if (meta.siteName && meta.siteName !== meta.domain) {
      frontmatterLines.push(`site_name: ${JSON.stringify(meta.siteName)}`);
    }
    if (meta.excerpt) {
      frontmatterLines.push(`excerpt: ${JSON.stringify(meta.excerpt)}`);
    }
    frontmatterLines.push(`date: ${JSON.stringify(meta.extractedAt)}`);
    frontmatterLines.push('---', '', '');

    finalMarkdown = frontmatterLines.join('\n') + bodyMarkdown;
  } else {
    // Add title as H1 heading if frontmatter disabled
    finalMarkdown = `# ${extracted.title}\n\n${bodyMarkdown}`;
  }

  // Calculate statistics
  const words = finalMarkdown.match(/\S+/g) || [];
  const wordCount = words.length;
  const charCount = finalMarkdown.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Count images and links in final markdown
  const imageMatches = finalMarkdown.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/g) || [];
  const linkMatches = finalMarkdown.match(/\[.*?\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/g) || [];

  const suggestedFilename = sanitizeFilename(extracted.title);

  return {
    markdown: finalMarkdown,
    suggestedFilename,
    wordCount,
    charCount,
    readingTimeMinutes,
    imageCount: imageMatches.length,
    linkCount: Math.max(0, linkMatches.length - imageMatches.length),
  };
}

function extractImgSrc(attrs: string): string | null {
  let src = extractAttr(attrs, 'src') || '';
  const dataSrc = extractAttr(attrs, 'data-src') || extractAttr(attrs, 'data-original') || extractAttr(attrs, 'data-lazy-src') || '';
  const srcset = extractAttr(attrs, 'srcset') || extractAttr(attrs, 'data-srcset') || '';
  
  if ((!src || src.startsWith('data:image')) && dataSrc) {
    src = dataSrc;
  } else if ((!src || src.startsWith('data:image')) && srcset) {
    const firstSrc = srcset.split(',')[0].trim().split(' ')[0];
    if (firstSrc) src = firstSrc;
  }

  if (!src || src.startsWith('data:image')) return null;
  return src;
}

function extractAttr(attrsString: string, attrName: string): string | null {
  const regex = new RegExp(`(?:^|\\s)${attrName}=["']([^"']+)["']`, 'i');
  const match = attrsString.match(regex);
  return match ? match[1] : null;
}

function resolveAbsoluteUrl(relativeUrl: string, baseUrl?: string): string {
  if (!relativeUrl) return '';

  // Protocol-relative URL: //upload.wikimedia.org/...
  if (relativeUrl.startsWith('//')) {
    return `https:${relativeUrl}`;
  }

  // Already absolute HTTP/HTTPS
  if (/^https?:\/\//i.test(relativeUrl)) {
    return relativeUrl;
  }

  // If we have a base URL, resolve relative paths like /images/pic.png or ./pic.png
  if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
    try {
      const urlObj = new URL(relativeUrl, baseUrl);
      return urlObj.href;
    } catch {
      return relativeUrl;
    }
  }

  return relativeUrl;
}

function cleanInline(str: string): string {
  return decodeEntities(str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
