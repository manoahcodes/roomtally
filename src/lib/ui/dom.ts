/**
 * Small DOM helpers (TDD §D.26, §G.49). There is deliberately no helper that parses
 * markup: user text only ever reaches the page as a text node or textContent.
 */

export type Child = Node | string | number | null | undefined | false;
export type AttrValue = string | number | boolean | null | undefined;
export type Attrs = Record<string, AttrValue>;

/** Attributes el() will set. Anything else, including every on* handler and style, throws. */
const ALLOWED_ATTRS: ReadonlySet<string> = new Set([
  'class',
  'id',
  'type',
  'name',
  'value',
  'for',
  'href',
  'rel',
  'target',
  'role',
  'title',
  'alt',
  'lang',
  'placeholder',
  'min',
  'max',
  'step',
  'inputmode',
  'autocomplete',
  'maxlength',
  'minlength',
  'required',
  'disabled',
  'hidden',
  'checked',
  'selected',
  'readonly',
  'tabindex',
  'colspan',
  'rowspan',
  'scope',
  'open',
  'multiple',
  'pattern',
]);

const SAFE_SCHEMES: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** True for relative links and for http, https, mailto and tel links only. */
export function isSafeUrl(value: string): boolean {
  // Browsers ignore whitespace and control characters inside a scheme, so ignore them too.
  const compact = value.replace(/[\u0000- ]/g, '');
  const scheme = /^([a-z][a-z0-9+.-]*:)/i.exec(compact)?.[1];
  return scheme === undefined || SAFE_SCHEMES.has(scheme.toLowerCase());
}

function isAllowedAttr(name: string): boolean {
  return ALLOWED_ATTRS.has(name) || name.startsWith('data-') || name.startsWith('aria-');
}

/** First element matching a selector, or null. */
export function select<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T | null {
  return root.querySelector<T>(selector);
}

export function selectAll<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

/** Set an element's text. The text is never read as HTML. Does nothing for null. */
export function setText(element: Element | null | undefined, text: string): void {
  if (element) element.textContent = text;
}

/**
 * Create an element. Strings in `children` become text nodes, never markup.
 * Only allowed attribute names are set; links must pass isSafeUrl.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: readonly Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (!isAllowedAttr(name)) {
      throw new TypeError(`Attribute "${name}" is not allowed in el()`);
    }
    const text = value === true ? '' : String(value);
    if (name === 'href' && !isSafeUrl(text)) {
      throw new TypeError('Unsafe URL in el()');
    }
    node.setAttribute(name, text);
  }
  if (node.getAttribute('target') === '_blank') {
    const rel = new Set((node.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    node.setAttribute('rel', [...rel].join(' '));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' || typeof child === 'number' ? String(child) : child);
  }
  return node;
}

/** Remove every child of an element. */
export function clear(element: Element): void {
  element.replaceChildren();
}

const BANNER_ATTR = 'data-global-error';
export const GLOBAL_ERROR_MESSAGE = 'Something went wrong on this page. Reload to try again.';

/** True when every URL in a stack or filename belongs to another origin. */
function isThirdParty(text: string | undefined, origin: string): boolean {
  if (!text) return false;
  const origins = (text.match(/https?:\/\/[^\s)'"]+/g) ?? []).map((url) => {
    try {
      return new URL(url).origin;
    } catch {
      return '';
    }
  });
  return origins.length > 0 && origins.every((o) => o !== '' && o !== origin);
}

function showBanner(): void {
  if (select(`[${BANNER_ATTR}]`)) return;
  const dismiss = el(
    'button',
    { type: 'button', class: 'touch-target underline ml-3', 'aria-label': 'Dismiss message' },
    ['Dismiss'],
  );
  const banner = el(
    'div',
    {
      role: 'alert',
      class: 'bg-error text-cream-50 px-4 py-3 text-center text-sm',
      [BANNER_ATTR]: true,
    },
    [GLOBAL_ERROR_MESSAGE, dismiss],
  );
  dismiss.addEventListener('click', () => banner.remove());
  document.body.prepend(banner);
}

/**
 * Catch uncaught errors and promise rejections: log one line, show one friendly banner,
 * never show a stack trace (TDD §G.49). Errors from other origins (ads, consent,
 * analytics) are ignored, because optional scripts must fail silent (TDD §G.47).
 * Returns a function that removes the listeners.
 */
export function installGlobalErrorHandler(target: Window = window): () => void {
  const origin = target.location.origin;

  const onError = (event: ErrorEvent): void => {
    if (event.message === 'Script error.') return;
    if (isThirdParty(event.filename, origin)) return;
    console.error('Roomtally: unexpected error');
    showBanner();
  };
  const onRejection = (event: PromiseRejectionEvent): void => {
    const reason: unknown = event.reason;
    const stack = reason instanceof Error ? reason.stack : undefined;
    if (isThirdParty(stack, origin)) return;
    console.error('Roomtally: unexpected rejection');
    showBanner();
  };

  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}
