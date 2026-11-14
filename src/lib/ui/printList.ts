/**
 * One-page printable shopping list (PRD Rule 16).
 *
 * global.css already hides the header, footer, form, ads and consent banner in print.
 * This file adds the one thing a printed list needs: a title and today's date at the top
 * of the results. The block is never visible on screen (it is `hidden` and only `print:block`),
 * is added just before window.print() and is removed again after printing, so the page is
 * left exactly as it was. All text goes through dom.ts.
 */
import { SITE } from '../../config/site';
import { el, select } from './dom';
import { track } from './analytics';

const PRINT_ATTR = 'data-print-header';

export interface PrintOptions {
  /** Where to put the title. Defaults to the [data-results] section. */
  container?: Element | null;
  win?: Window;
}

/** "14 November 2026" in the visitor's language. */
export function formatPrintDate(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function removeHeaders(doc: Document): void {
  for (const node of doc.querySelectorAll(`[${PRINT_ATTR}]`)) node.remove();
}

/** Number of rooms shown in the results, or 0 when it cannot be read. */
function roomCount(container: Element): number {
  const text = select('[data-result-room-count]', container)?.textContent ?? '';
  const count = Number.parseInt(text, 10);
  return Number.isFinite(count) ? count : 0;
}

/**
 * Add a print-only title and date, open the print dialog, then take them away again.
 * Returns false when there is no results section to print.
 */
export function printShoppingList(options: PrintOptions = {}): boolean {
  const win = options.win ?? window;
  const doc = win.document;
  const container = options.container === undefined ? select('[data-results]', doc) : options.container;
  if (!container) return false;

  removeHeaders(doc); // A header left over from an earlier print must not appear twice.
  const header = el('div', { class: 'hidden print:block mb-4', [PRINT_ATTR]: true }, [
    el('p', { class: 'text-h3 font-bold' }, [`${SITE.name} shopping list`]),
    el('p', {}, [formatPrintDate(new Date())]),
  ]);
  container.prepend(header);

  const cleanup = (): void => {
    header.remove();
    win.removeEventListener('afterprint', cleanup);
  };
  // Some browsers return from print() before the preview is drawn, so wait for afterprint.
  win.addEventListener('afterprint', cleanup);

  track('list_printed', { room_count: roomCount(container) });
  try {
    win.print();
  } catch {
    cleanup();
    return false;
  }
  return true;
}

/** Make every [data-print] button open the print dialog. Returns a function that undoes it. */
export function bindPrintButtons(root: ParentNode = document): () => void {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('[data-print]'));
  const onClick = (event: Event): void => {
    event.preventDefault();
    printShoppingList();
  };
  for (const button of buttons) button.addEventListener('click', onClick);
  return () => {
    for (const button of buttons) button.removeEventListener('click', onClick);
  };
}
