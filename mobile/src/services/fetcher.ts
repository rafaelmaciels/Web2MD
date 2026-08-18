import { Platform } from 'react-native';
import { ExtractedPage, ArticleMetadata } from '../types';

/**
 * Mobile Article Fetcher & Content Extractor
 * Fetches remote HTML, strips noise, parses metadata and extracts main article content.
 * Includes CORS proxy fallback when running in Web browser preview.
 */

export async function fetchAndExtractUrl(targetUrl: string): Promise<ExtractedPage> {
  // Normalize URL
  let validUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(validUrl)) {
    validUrl = `https://${validUrl}`;
  }

  let domain = 'unknown';
  try {
    const parsed = new URL(validUrl);
    domain = parsed.hostname.replace(/^www\./, '');
  } catch {
    domain = validUrl;
  }

  let rawHtml = '';
  let lastError: Error | null = null;

  // On Web preview, standard fetch is blocked by browser CORS policy.
  // Use public CORS proxies when on Web platform.
  if (Platform.OS === 'web') {
    const proxies = [
      (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    for (const proxyGen of proxies) {
      try {
        const proxyUrl = proxyGen(validUrl);
        const res = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        if (res.ok) {
          rawHtml = await res.text();
          if (rawHtml && rawHtml.length > 50) {
            break;
          }
        }
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  // Native iOS / Android or Web direct fallback
  if (!rawHtml) {
    try {
      const response = await fetch(validUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load page: HTTP ${response.status} (${response.statusText})`);
      }

      rawHtml = await response.text();
    } catch (nativeErr: any) {
      if (Platform.OS === 'web') {
        throw new Error(
          `CORS policy blocked direct web fetch for "${validUrl}". On smartphone (Expo Go / Android / iOS), this request runs without CORS restrictions. For web preview, you can also use the "HTML / Text" tab to paste content directly.`
        );
      }
      throw new Error(nativeErr?.message || `Failed to fetch URL: ${validUrl}`);
    }
  }

  return extractFromHtmlString(rawHtml, validUrl, domain);
}

export function extractFromHtmlString(
  rawHtml: string,
  targetUrl: string = 'https://localhost',
  domain: string = 'manual-input'
): ExtractedPage {
  // 1. Extract metadata from meta tags
  const title =
    extractTagContent(rawHtml, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    extractTagContent(rawHtml, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
    extractTagContent(rawHtml, /<title[^>]*>([\s\S]*?)<\/title>/i) ||
    extractTagContent(rawHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    'Untitled Web Page';

  const byline =
    extractTagContent(rawHtml, /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i) ||
    extractTagContent(rawHtml, /<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i) ||
    extractTagContent(rawHtml, /<meta[^>]+name=["']twitter:creator["'][^>]+content=["']([^"']+)["']/i) ||
    null;

  const siteName =
    extractTagContent(rawHtml, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
    domain;

  const excerpt =
    extractTagContent(rawHtml, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    extractTagContent(rawHtml, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    null;

  // 2. Clean HTML: Strip script, style, head, nav, header, footer, ads, svg, iframe
  let cleaned = rawHtml
    .replace(/<!--[\s\S]*?-->/g, '') // comments
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  // 3. Find main article container if available (<article>, <main>, role="main", .article-content, etc.)
  let contentHtml = '';
  const articleMatch = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = cleaned.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);

  if (articleMatch && articleMatch[1].trim().length > 100) {
    contentHtml = articleMatch[1];
  } else if (mainMatch && mainMatch[1].trim().length > 100) {
    contentHtml = mainMatch[1];
  } else if (bodyMatch && bodyMatch[1].trim().length > 100) {
    contentHtml = bodyMatch[1];
  } else {
    contentHtml = cleaned;
  }

  // Strip non-content wrapper tags
  const textContent = contentHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const metadata: ArticleMetadata = {
    title: sanitizeTitle(title),
    byline,
    siteName,
    excerpt,
    length: textContent.length,
    url: targetUrl,
    domain,
    extractedAt: new Date().toISOString(),
  };

  return {
    title: sanitizeTitle(title),
    contentHtml,
    textContent,
    url: targetUrl,
    domain,
    metadata,
  };
}

export function extractFromRawText(text: string, title = 'Quick Note'): ExtractedPage {
  const cleanTitle = title.trim() || 'Manual Content';
  const metadata: ArticleMetadata = {
    title: cleanTitle,
    url: 'manual://input',
    domain: 'manual',
    extractedAt: new Date().toISOString(),
  };

  return {
    title: cleanTitle,
    contentHtml: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
    textContent: text,
    url: 'manual://input',
    domain: 'manual',
    metadata,
  };
}

function extractTagContent(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  if (match && match[1]) {
    return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function sanitizeTitle(str: string): string {
  return decodeHtmlEntities(str.replace(/[\r\n\t]+/g, ' ').trim());
}

function decodeHtmlEntities(str: string): string {
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
