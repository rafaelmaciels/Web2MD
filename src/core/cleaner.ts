/**
 * DOM Cleaner module for Web2MD
 * Prunes non-essential elements (scripts, styles, ads, navbars, sidebars, popups)
 * from a cloned DOM node to maximize content extraction quality.
 */

export function cleanDOM(documentClone: Document): Document {
  // 1. Remove elements that are unconditionally irrelevant
  const tagsToRemove = [
    'script',
    'style',
    'noscript',
    'iframe',
    'object',
    'embed',
    'canvas',
    'svg',
    'form',
    'input',
    'textarea',
    'button',
    'select',
    'option',
    'dialog',
  ];

  tagsToRemove.forEach((tag) => {
    const elements = documentClone.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });

  // 2. Remove standard navigation, footer, sidebar and ad elements
  const selectorsToRemove = [
    'nav',
    'header',
    'footer',
    'aside',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[role="complementary"]',
    '.nav',
    '.navbar',
    '.header',
    '.footer',
    '.sidebar',
    '.side-bar',
    '.widget',
    '.ad',
    '.ads',
    '.advertisement',
    '.social-share',
    '.share-buttons',
    '.cookie-banner',
    '.cookie-consent',
    '.popup',
    '.modal',
    '#nav',
    '#header',
    '#footer',
    '#sidebar',
    '#comments',
  ];

  selectorsToRemove.forEach((selector) => {
    try {
      const elements = documentClone.querySelectorAll(selector);
      elements.forEach((el) => {
        // Keep header if it looks like article header containing H1
        if (selector === 'header' || selector === '.header') {
          if (el.querySelector('h1')) {
            return;
          }
        }
        el.remove();
      });
    } catch {
      // Ignore query selector syntax errors if any
    }
  });

  // 3. Remove hidden elements
  const allElements = documentClone.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.getAttribute('aria-hidden') === 'true') {
      htmlEl.remove();
      return;
    }
    const style = htmlEl.getAttribute('style');
    if (style) {
      if (style.includes('display: none') || style.includes('visibility: hidden')) {
        htmlEl.remove();
      }
    }
  });

  // 4. Remove HTML comments
  removeComments(documentClone.documentElement);

  return documentClone;
}

function removeComments(node: Node) {
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      removeComments(child);
    }
  }
}
