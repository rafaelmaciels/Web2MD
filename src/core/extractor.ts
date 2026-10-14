import { Readability } from '@mozilla/readability';
import { cleanDOM } from './cleaner';
import { ArticleMetadata, ExtractedPage } from '../shared/types';

export function extractPageContent(doc: Document, targetUrl?: string): ExtractedPage {
  const currentUrl = targetUrl || doc.location?.href || 'https://localhost';
  
  let domain = '';
  try {
    const parsedUrl = new URL(currentUrl);
    if (parsedUrl.protocol === 'file:') {
      domain = 'local file';
    } else {
      domain = parsedUrl.hostname.replace(/^www\./, '');
    }
  } catch {
    domain = 'unknown';
  }

  // Clone document to avoid modifying active page
  const docClone = doc.cloneNode(true) as Document;

  // Pre-normalize images to ensure lazy-loading attributes & relative paths are resolved
  normalizeImages(docClone, currentUrl);
  
  // Clean cloned DOM
  const cleanedDoc = cleanDOM(docClone);

  // Normalize images once more on cleanedDoc
  normalizeImages(cleanedDoc, currentUrl);

  // Attempt Readability extraction
  let article: ReturnType<Readability['parse']> = null;
  try {
    const reader = new Readability(cleanedDoc, {
      charThreshold: 20,
      classesToPreserve: ['highlight', 'code', 'language-*', 'rouge-code', 'prism-code'],
    });
    article = reader.parse();
  } catch (err) {
    console.warn('[Web2MD] Readability parsing fallback:', err);
  }

  // Determine title with fallback for local files
  let fileTitleFallback = '';
  try {
    const parsedUrl = new URL(currentUrl);
    if (parsedUrl.protocol === 'file:') {
      const fileName = decodeURIComponent(parsedUrl.pathname.split('/').filter(Boolean).pop() || '');
      fileTitleFallback = fileName.replace(/\.[^/.]+$/, '');
    }
  } catch {
    // Ignore URL parse error
  }

  const title =
    article?.title ||
    doc.title ||
    doc.querySelector('h1')?.textContent?.trim() ||
    fileTitleFallback ||
    'Untitled Page';

  // Determine content HTML & text
  const contentHtml = article?.content || cleanedDoc.body?.innerHTML || doc.body?.innerHTML || '';
  const textContent = article?.textContent || cleanedDoc.body?.textContent || doc.body?.textContent || '';

  // Metadata
  const metadata: ArticleMetadata = {
    title,
    byline: article?.byline || getMetaContent(doc, ['author', 'article:author', 'twitter:creator', 'og:article:author']),
    siteName: article?.siteName || getMetaContent(doc, ['og:site_name', 'twitter:site']) || domain,
    excerpt: article?.excerpt || getMetaContent(doc, ['description', 'og:description', 'twitter:description']),
    length: article?.length || textContent.length,
    dir: article?.dir || doc.documentElement.dir || 'ltr',
    url: currentUrl,
    domain,
    extractedAt: new Date().toISOString(),
  };

  return {
    title,
    contentHtml,
    textContent,
    url: currentUrl,
    domain,
    metadata,
  };
}

function getMetaContent(doc: Document, names: string[]): string | null {
  for (const name of names) {
    const meta = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (meta) {
      const content = meta.getAttribute('content');
      if (content && content.trim()) {
        return content.trim();
      }
    }
  }
  return null;
}

function normalizeImages(doc: Document, baseUrl: string) {
  const images = doc.querySelectorAll('img');
  images.forEach((img) => {
    // 1. Resolve lazy-loading data attributes if src is missing or a placeholder
    const rawSrc = img.getAttribute('src') || '';
    const dataSrc =
      img.getAttribute('data-src') ||
      img.getAttribute('data-original') ||
      img.getAttribute('data-lazy-src') ||
      img.getAttribute('data-actualsrc') ||
      img.getAttribute('data-orig-file') ||
      img.getAttribute('data-hi-res-src');
    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');

    let bestSrc = rawSrc;
    const isPlaceholder = !rawSrc || rawSrc.startsWith('data:image') || rawSrc.startsWith('blob:');

    if (isPlaceholder && dataSrc) {
      bestSrc = dataSrc;
    } else if (isPlaceholder && srcset) {
      const firstSrc = srcset.split(',')[0].trim().split(/\s+/)[0];
      if (firstSrc) bestSrc = firstSrc;
    }

    // Check parent <picture> element if still placeholder or empty
    if ((!bestSrc || bestSrc.startsWith('data:image')) && img.parentElement?.tagName.toUpperCase() === 'PICTURE') {
      const sources = img.parentElement.querySelectorAll('source');
      for (let i = 0; i < sources.length; i++) {
        const sSrcset = sources[i].getAttribute('srcset') || sources[i].getAttribute('data-srcset');
        if (sSrcset) {
          const cand = sSrcset.split(',')[0].trim().split(/\s+/)[0];
          if (cand && !cand.startsWith('data:image')) {
            bestSrc = cand;
            break;
          }
        }
      }
    }

    if (!bestSrc || bestSrc.startsWith('data:image')) {
      return;
    }

    // 2. Resolve relative or protocol-relative URLs
    if (bestSrc.startsWith('//')) {
      bestSrc = 'https:' + bestSrc;
    } else if (!/^https?:\/\//i.test(bestSrc) && !bestSrc.startsWith('file://')) {
      try {
        bestSrc = new URL(bestSrc, baseUrl).href;
      } catch {
        // Keep as is if URL construction fails
      }
    }

    img.setAttribute('src', bestSrc);
    // Unset inline hidden display to ensure readability and downstream parsers retain it
    if (img.style.display === 'none' || img.style.visibility === 'hidden') {
      img.style.display = '';
      img.style.visibility = '';
    }
  });
}

