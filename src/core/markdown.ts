import TurndownService from 'turndown';
// @ts-ignore gfm plugin lacks full ESM type bindings in some builds
import { gfm } from 'turndown-plugin-gfm';
import { ConversionResult, ExtractedPage, UserSettings } from '../shared/types';
import { sanitizeFilename } from './filename';

export function convertToMarkdown(
  extracted: ExtractedPage,
  settings: UserSettings
): ConversionResult {
  const turndown = new TurndownService({
    headingStyle: settings.headingStyle || 'atx',
    bulletListMarker: settings.bulletListMarker || '-',
    codeBlockStyle: settings.codeBlockStyle || 'fenced',
    fence: settings.fence || '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });

  // Enable GFM plugin (Tables, Task lists, Strikethrough)
  try {
    turndown.use(gfm);
  } catch (err) {
    console.warn('[Web2MD] GFM plugin initialization warning:', err);
  }

  // Custom rule for code blocks with language detection
  turndown.addRule('fencedCodeBlockWithLang', {
    filter: (node) => {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild !== null &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: (_content, node) => {
      const codeNode = node.firstChild as HTMLElement;
      const className = codeNode.getAttribute('class') || node.getAttribute('class') || '';
      
      let lang = '';
      const match = className.match(/(?:lang|language)-([a-zA-Z0-9_+-]+)/i);
      if (match) {
        lang = match[1].toLowerCase();
      }

      const codeText = codeNode.textContent || '';
      const fenceStr = settings.fence || '```';
      return `\n\n${fenceStr}${lang}\n${codeText.trim()}\n${fenceStr}\n\n`;
    },
  });

  // Handle image toggle
  if (!settings.includeImages) {
    turndown.addRule('stripImages', {
      filter: 'img',
      replacement: () => '',
    });
  }

  // Handle link toggle
  if (!settings.includeLinks) {
    turndown.addRule('stripLinks', {
      filter: 'a',
      replacement: (content) => content,
    });
  }

  // Perform HTML -> Markdown conversion
  let bodyMarkdown = '';
  if (extracted.selectionText && extracted.selectionText.trim()) {
    bodyMarkdown = extracted.selectionText.trim();
  } else {
    bodyMarkdown = turndown.turndown(extracted.contentHtml || '');
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
  const imageMatches = finalMarkdown.match(/!\[.*?\]\(.*?\)/g) || [];
  const linkMatches = finalMarkdown.match(/\[.*?\]\(.*?\)/g) || [];

  const suggestedFilename = sanitizeFilename(extracted.title);

  return {
    markdown: finalMarkdown,
    suggestedFilename,
    wordCount,
    charCount,
    readingTimeMinutes,
    imageCount: imageMatches.length,
    linkCount: linkMatches.length - imageMatches.length,
  };
}
