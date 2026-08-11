import { Readability } from '@mozilla/readability';
import { cleanDOM } from './cleaner';
import { ArticleMetadata, ExtractedPage } from '../shared/types';

export function extractPageContent(doc: Document, targetUrl?: string): ExtractedPage {
  const currentUrl = targetUrl || doc.location?.href || 'https://localhost';
  
  let domain = '';
  try {
    const parsedUrl = new URL(currentUrl);
    domain = parsedUrl.hostname.replace(/^www\./, '');
  } catch {
    domain = 'unknown';
  }

  // Clone document to avoid modifying active page
  const docClone = doc.cloneNode(true) as Document;
  
  // Clean cloned DOM
  const cleanedDoc = cleanDOM(docClone);

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

  // Determine title
  const title = article?.title || doc.title || doc.querySelector('h1')?.textContent?.trim() || 'Untitled Page';

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
