// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GLOBAL_ERROR_MESSAGE,
  clear,
  el,
  installGlobalErrorHandler,
  isSafeUrl,
  select,
  selectAll,
  setText,
} from '../../src/lib/ui/dom';

const MARKUP = '<img src=x onerror=alert(1)><b>bold</b>';

beforeEach(() => {
  document.body.replaceChildren();
});

describe('el', () => {
  it('creates an element with attributes and children', () => {
    const node = el('a', { href: '/guides/', class: 'link', 'data-x': 1, 'aria-label': 'Guides' }, ['Guides']);
    expect(node.tagName).toBe('A');
    expect(node.getAttribute('href')).toBe('/guides/');
    expect(node.className).toBe('link');
    expect(node.getAttribute('data-x')).toBe('1');
    expect(node.getAttribute('aria-label')).toBe('Guides');
    expect(node.textContent).toBe('Guides');
  });

  it('shows markup in a string child as plain text, never as elements', () => {
    const node = el('p', {}, [MARKUP]);
    expect(node.textContent).toBe(MARKUP);
    expect(node.children).toHaveLength(0);
    expect(node.querySelector('img')).toBeNull();
  });

  it('accepts nodes and numbers as children and skips empty ones', () => {
    const inner = el('span', {}, ['in']);
    const node = el('p', {}, [inner, 7, null, undefined, false]);
    expect(node.children).toHaveLength(1);
    expect(node.textContent).toBe('in7');
  });

  it('sets boolean attributes for true and skips false, null and undefined', () => {
    const node = el('input', { required: true, disabled: false, placeholder: null, title: undefined });
    expect(node.hasAttribute('required')).toBe(true);
    expect(node.hasAttribute('disabled')).toBe(false);
    expect(node.hasAttribute('placeholder')).toBe(false);
    expect(node.hasAttribute('title')).toBe(false);
  });

  it.each([['onclick'], ['onerror'], ['ONLOAD'], ['style'], ['srcdoc'], ['src'], ['formaction']])(
    'refuses the attribute %s',
    (name) => {
      expect(() => el('div', { [name]: 'alert(1)' })).toThrow(TypeError);
    },
  );

  it.each([
    ['javascript:alert(1)'],
    ['JaVaScRiPt:alert(1)'],
    ['java\tscript:alert(1)'],
    [' javascript:alert(1)'],
    ['data:text/html,<script>1</script>'],
    ['vbscript:x'],
  ])('refuses the link %s', (href) => {
    expect(() => el('a', { href })).toThrow(TypeError);
  });

  it.each([['/paint-calculator/'], ['#results'], ['guides/x/'], ['https://example.com/a'], ['mailto:a@b.co']])(
    'allows the link %s',
    (href) => {
      expect(el('a', { href }).getAttribute('href')).toBe(href);
    },
  );

  it('adds noopener to links that open a new tab, keeping other rel values', () => {
    expect(el('a', { href: '/x/', target: '_blank' }).getAttribute('rel')).toBe('noopener');
    const sponsored = el('a', { href: 'https://e.co', target: '_blank', rel: 'sponsored nofollow' });
    expect(sponsored.getAttribute('rel')!.split(' ').sort()).toEqual(['nofollow', 'noopener', 'sponsored']);
  });
});

describe('isSafeUrl', () => {
  it('allows relative, http, https, mailto and tel only', () => {
    expect(isSafeUrl('/a')).toBe(true);
    expect(isSafeUrl('https://a.co')).toBe(true);
    expect(isSafeUrl('tel:+123')).toBe(true);
    expect(isSafeUrl('ftp://a.co')).toBe(false);
    expect(isSafeUrl('javascript:1')).toBe(false);
  });
});

describe('setText, select, selectAll, clear', () => {
  it('setText writes text and never parses it', () => {
    const p = el('p');
    setText(p, MARKUP);
    expect(p.textContent).toBe(MARKUP);
    expect(p.children).toHaveLength(0);
  });
  it('setText ignores null', () => {
    expect(() => setText(null, 'x')).not.toThrow();
  });
  it('select and selectAll find elements inside a root', () => {
    const root = el('div', {}, [el('p', { class: 'a' }), el('p', { class: 'a' })]);
    document.body.append(root);
    expect(select('.a', root)).not.toBeNull();
    expect(select('.missing', root)).toBeNull();
    expect(selectAll('.a', root)).toHaveLength(2);
    expect(select('div')).toBe(root);
  });
  it('clear removes every child', () => {
    const root = el('div', {}, ['a', el('b')]);
    clear(root);
    expect(root.childNodes).toHaveLength(0);
  });
});

describe('installGlobalErrorHandler', () => {
  let stop: () => void;
  let errorLog: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stop = installGlobalErrorHandler();
  });
  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  const banners = () => document.querySelectorAll('[data-global-error]');
  const fire = (init: ErrorEventInit) => window.dispatchEvent(new ErrorEvent('error', init));

  it('shows one friendly banner and logs one line for an uncaught error', () => {
    fire({ message: 'boom at secret-internal-state', filename: `${location.origin}/app.js` });
    expect(banners()).toHaveLength(1);
    const banner = banners()[0]!;
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.textContent).toContain(GLOBAL_ERROR_MESSAGE);
    expect(errorLog).toHaveBeenCalledTimes(1);
  });

  it('never puts the error text, a stack or stored data in the banner or the log', () => {
    const err = new Error('secret-internal-state');
    fire({ message: err.message, error: err, filename: `${location.origin}/app.js` });
    expect(document.body.textContent).not.toContain('secret-internal-state');
    expect(document.body.textContent).not.toContain('at ');
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('secret-internal-state');
  });

  it('shows only one banner however many errors happen', () => {
    for (let i = 0; i < 3; i += 1) fire({ message: 'x', filename: `${location.origin}/a.js` });
    expect(banners()).toHaveLength(1);
  });

  it('can be dismissed', () => {
    fire({ message: 'x', filename: `${location.origin}/a.js` });
    (banners()[0]!.querySelector('button') as HTMLButtonElement).click();
    expect(banners()).toHaveLength(0);
  });

  it('ignores errors from another origin and opaque "Script error." events', () => {
    fire({ message: 'ad broke', filename: 'https://pagead2.googlesyndication.com/x.js' });
    fire({ message: 'Script error.', filename: '' });
    expect(banners()).toHaveLength(0);
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('handles an unhandled promise rejection the same way', () => {
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: new Error('secret-internal-state'),
    });
    window.dispatchEvent(event);
    expect(banners()).toHaveLength(1);
    expect(document.body.textContent).not.toContain('secret-internal-state');
  });

  it('stops listening after the returned function is called', () => {
    stop();
    fire({ message: 'x', filename: `${location.origin}/a.js` });
    expect(banners()).toHaveLength(0);
  });
});
