export interface ArticleMetadata {
  title: string;
  byline?: string | null;
  siteName?: string | null;
  excerpt?: string | null;
  length?: number;
  dir?: string | null;
  url: string;
  domain: string;
  extractedAt: string;
}

export interface UserSettings {
  includeFrontmatter: boolean;
  includeImages: boolean;
  includeLinks: boolean;
  headingStyle: 'atx' | 'setext';
  bulletListMarker: '-' | '*' | '+';
  codeBlockStyle: 'fenced' | 'indented';
  fence: '```' | '~~~';
  downloadFolder: string;
  theme: 'system' | 'dark' | 'light';
  autoCopy: boolean;
  removeQueryParameters: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  includeFrontmatter: true,
  includeImages: true,
  includeLinks: true,
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  downloadFolder: '',
  theme: 'dark',
  autoCopy: false,
  removeQueryParameters: false,
};

export interface ExtractedPage {
  title: string;
  contentHtml: string;
  textContent: string;
  url: string;
  domain: string;
  metadata: ArticleMetadata;
  selectionText?: string;
}

export interface ConversionResult {
  markdown: string;
  suggestedFilename: string;
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  imageCount: number;
  linkCount: number;
}

export type ExtensionMessageType =
  | 'EXTRACT_CONTENT'
  | 'GET_SELECTION'
  | 'CONTENT_EXTRACTED'
  | 'CONVERT_TO_MARKDOWN'
  | 'TRIGGER_DOWNLOAD'
  | 'COPY_CLIPBOARD'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS';

export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload?: any;
}

export interface ExtensionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
