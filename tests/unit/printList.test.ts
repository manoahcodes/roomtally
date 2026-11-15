// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindPrintButtons, formatPrintDate, printShoppingList } from '../../src/lib/ui/printList';

function results(): HTMLElement {
  const section = document.createElement('section');
  section.setAttribute('data-results', '');
  const count = document.createElement('span');
  count.setAttribute('data-result-room-count', '');
  count.textContent = '3 rooms';
  section.append(count);
  return section;
}

describe('printList', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.spyOn(window, 'print').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('formats the date in the requested locale', () => {
    expect(formatPrintDate(new Date('2026-11-14T12:00:00Z'), 'en-GB')).toBe('14 November 2026');
  });

  it('returns false when there is no results section', () => {
    expect(printShoppingList()).toBe(false);
    expect(window.print).not.toHaveBeenCalled();
  });

  it('adds one print header and removes it after the print dialog closes', () => {
    const section = results();
    document.body.append(section);

    expect(printShoppingList()).toBe(true);
    expect(section.querySelectorAll('[data-print-header]')).toHaveLength(1);
    expect(section.textContent).toContain('shopping list');
    expect(window.print).toHaveBeenCalledOnce();

    window.dispatchEvent(new Event('afterprint'));
    expect(section.querySelector('[data-print-header]')).toBeNull();
  });

  it('removes a stale header before adding a new one', () => {
    const section = results();
    const stale = document.createElement('div');
    stale.setAttribute('data-print-header', '');
    document.body.append(stale, section);

    expect(printShoppingList()).toBe(true);
    expect(document.querySelectorAll('[data-print-header]')).toHaveLength(1);
    window.dispatchEvent(new Event('afterprint'));
  });

  it('cleans up immediately if the browser print call throws', () => {
    const section = results();
    document.body.append(section);
    vi.mocked(window.print).mockImplementation(() => {
      throw new Error('print unavailable');
    });

    expect(printShoppingList()).toBe(false);
    expect(section.querySelector('[data-print-header]')).toBeNull();
  });

  it('binds print buttons and returns an unbind function', () => {
    const button = document.createElement('button');
    button.setAttribute('data-print', '');
    document.body.append(button, results());
    const unbind = bindPrintButtons();

    button.click();
    expect(window.print).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('afterprint'));

    unbind();
    vi.mocked(window.print).mockClear();
    button.click();
    expect(window.print).not.toHaveBeenCalled();
  });
});
