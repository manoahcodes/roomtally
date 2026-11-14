// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { buildShoppingList } from '../../src/lib/calc/shoppingList';
import { el, select, selectAll } from '../../src/lib/ui/dom';
import {
  formatBuy,
  formatPackLine,
  formatQuantity,
  renderEmpty,
  renderInvalid,
  renderShoppingList,
} from '../../src/lib/ui/renderResults';
import type { MaterialResult } from '../../src/types/calc';
import { makeMultiRoomProject, makeProject, makeRoom, makeSettings } from '../helpers/roomFixtures';

const PAINT_ONLY = makeSettings({ enabledMaterials: ['paint'] });

/** The same hooks ShoppingList.astro and MaterialCard.astro provide, built without innerHTML. */
function buildContainer(): HTMLElement {
  const card = el('article', { 'data-material-card': '' }, [
    el('h3', { 'data-card-title': true }),
    el('p', {}, [el('span', { 'data-buy-value': true }), el('span', { 'data-buy-unit': true })]),
    el('p', { 'data-pack-line': true }),
    el('p', {}, ['Exact need: ', el('span', { 'data-exact': true })]),
    el('p', { 'data-tiles': true, hidden: true }),
    el('input', { type: 'text', 'data-price-input': '' }),
    el('p', { 'data-cost': true, hidden: true }, [el('span', { 'data-cost-value': true })]),
  ]);
  const cardTemplate = el('template', { 'data-card-template': true });
  cardTemplate.content.append(el('li', {}, [card]));

  const assumptionItem = el('div', { 'data-assumption-item': true }, [
    el('dt', { 'data-assumption-label': true }),
    el('dd', {}, [
      el('span', { 'data-assumption-value': true }),
      el('span', { 'data-assumption-changed': true, hidden: true }, ['Changed']),
    ]),
  ]);
  const assumptionTemplate = el('template', { 'data-assumption-template': true });
  assumptionTemplate.content.append(assumptionItem);

  return el('section', { 'data-results': true }, [
    el('p', { 'data-results-empty': true }, ['Enter your room.']),
    el('p', { 'data-results-invalid': true, hidden: true }, ['Fix the fields.']),
    el('div', { 'data-results-live': true, hidden: true }, [
      el('span', { 'data-result-room-count': true }),
      el('ul', { 'data-card-list': true }),
      el('p', { 'data-total': true, hidden: true }, [el('span', { 'data-total-value': true })]),
    ]),
    el('dl', { 'data-assumptions-live': true, hidden: true }),
    el('div', { 'data-assumptions-defaults': true }, ['defaults']),
    cardTemplate,
    assumptionTemplate,
  ]);
}

let container: HTMLElement;

beforeEach(() => {
  document.body.replaceChildren();
  container = buildContainer();
  document.body.append(container);
});

describe('renderShoppingList: buy first, exact second', () => {
  it('shows the whole-pack buy quantity before the exact need', () => {
    const list = buildShoppingList(makeMultiRoomProject(PAINT_ONLY));
    renderShoppingList(container, list);

    const card = select('[data-material-card="paint"]', container)!;
    expect(select('[data-buy-value]', card)!.textContent).toBe('3');
    expect(select('[data-buy-unit]', card)!.textContent).toBe('cans');
    expect(select('[data-exact]', card)!.textContent).toBe('20.66 L');
    expect(select('[data-pack-line]', card)!.textContent).toBe('2 × 10 L + 1 × 1 L. Covers 21 L.');

    const text = card.textContent ?? '';
    expect(text.indexOf('3')).toBeLessThan(text.indexOf('Exact need'));
  });

  it('shows the room count and swaps the empty message for the list', () => {
    renderShoppingList(container, buildShoppingList(makeMultiRoomProject(PAINT_ONLY)));
    expect(select('[data-result-room-count]', container)!.textContent).toBe('3');
    expect(select('[data-results-empty]', container)!.hidden).toBe(true);
    expect(select('[data-results-live]', container)!.hidden).toBe(false);
    expect(select('[data-assumptions-defaults]', container)!.hidden).toBe(true);
  });

  it('renders one card per material, in order', () => {
    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], makeSettings())));
    const keys = selectAll('[data-material-card]', container).map((c) =>
      c.getAttribute('data-material-card'),
    );
    expect(keys).toEqual(['paint', 'flooring', 'tile', 'wallpaper']);
  });

  it('shows tile counts only on the tile card', () => {
    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], makeSettings())));
    expect(select('[data-material-card="tile"] [data-tiles]', container)!.hidden).toBe(false);
    expect(select('[data-material-card="paint"] [data-tiles]', container)!.hidden).toBe(true);
  });

  it('shows a cost only when a price exists, labelled by the surrounding markup', () => {
    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], PAINT_ONLY)));
    expect(select('[data-cost]', container)!.hidden).toBe(true);

    const priced = makeSettings({ enabledMaterials: ['paint'], prices: { paint: 20 } });
    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], priced)));
    expect(select('[data-cost]', container)!.hidden).toBe(false);
    expect(select('[data-cost-value]', container)!.textContent).not.toBe('');
    expect(select('[data-total]', container)!.hidden).toBe(false);
  });
});

describe('renderShoppingList: text only', () => {
  const HOSTILE = '<img src=x onerror=alert(1)><script>alert(2)</script>';

  it('renders a room name containing markup as text', () => {
    // Different coats make the assumptions label carry the room name.
    const a = makeRoom({ id: 'a', name: HOSTILE });
    const b = makeRoom({ id: 'b', name: 'Hall', paint: { ...makeRoom().paint, coats: 3 } });
    renderShoppingList(container, buildShoppingList(makeProject([a, b], PAINT_ONLY)));

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain(HOSTILE);
    const labels = selectAll('[data-assumption-label]', container).map((n) => n.textContent ?? '');
    expect(labels.some((label) => label.includes(HOSTILE))).toBe(true);
  });

  it('never creates an element for text inside a label', () => {
    const list = buildShoppingList(makeProject([makeRoom()], PAINT_ONLY));
    list.items[0]!.label = '<b>Bold</b>';
    renderShoppingList(container, list);
    expect(select('[data-card-title]', container)!.textContent).toBe('<b>Bold</b>');
    expect(container.querySelector('b')).toBeNull();
  });
});

describe('renderShoppingList: updates in place', () => {
  it('keeps the price a visitor typed and the same card element on re-render', () => {
    const list = buildShoppingList(makeProject([makeRoom()], PAINT_ONLY));
    renderShoppingList(container, list);
    const input = select<HTMLInputElement>('[data-price-input]', container)!;
    input.value = '24.5';
    const card = select('[data-material-card]', container);

    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], PAINT_ONLY)));
    expect(select<HTMLInputElement>('[data-price-input]', container)).toBe(input);
    expect(input.value).toBe('24.5');
    expect(select('[data-material-card]', container)).toBe(card);
  });

  it('removes a card when its material is switched off', () => {
    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], makeSettings())));
    const onlyPaint = makeSettings({ enabledMaterials: ['paint'] });
    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], onlyPaint)));
    expect(selectAll('[data-material-card]', container)).toHaveLength(1);
  });
});

describe('states', () => {
  it('shows the empty message and clears cards', () => {
    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], PAINT_ONLY)));
    renderEmpty(container);
    expect(select('[data-results-empty]', container)!.hidden).toBe(false);
    expect(select('[data-results-live]', container)!.hidden).toBe(true);
    expect(selectAll('[data-material-card]', container)).toHaveLength(0);
  });

  it('shows the invalid message and removes the old list', () => {
    renderShoppingList(container, buildShoppingList(makeProject([makeRoom()], PAINT_ONLY)));
    renderInvalid(container);
    expect(select('[data-results-invalid]', container)!.hidden).toBe(false);
    expect(select('[data-results-live]', container)!.hidden).toBe(true);
    expect(selectAll('[data-material-card]', container)).toHaveLength(0);
  });

  it('treats a list with no items as empty', () => {
    const list = buildShoppingList(makeProject([makeRoom()], PAINT_ONLY));
    renderShoppingList(container, { ...list, items: [] });
    expect(select('[data-results-empty]', container)!.hidden).toBe(false);
  });
});

describe('formatting', () => {
  const paint: MaterialResult = {
    key: 'paint',
    label: 'Wall paint',
    unit: 'L',
    buyQuantity: 1,
    exactQuantity: 3.785411784,
    coveredQuantity: 3.785411784,
    packBreakdown: [{ packSize: 3.785411784, count: 1 }],
  };

  it('uses singular and plural pack nouns', () => {
    expect(formatBuy(paint)).toEqual({ value: '1', unit: 'can' });
    expect(formatBuy({ ...paint, key: 'flooring', buyQuantity: 4 })).toEqual({
      value: '4',
      unit: 'boxes',
    });
    expect(formatBuy({ ...paint, key: 'wallpaper', buyQuantity: 2 }).unit).toBe('rolls');
  });

  it('converts litres and square metres for imperial users', () => {
    expect(formatQuantity(3.785411784, 'L', 'imperial')).toBe('1 US gal');
    expect(formatQuantity(10, 'L', 'metric')).toBe('10 L');
    expect(formatQuantity(1, 'm2', 'imperial')).toBe('10.76 sq ft');
    expect(formatQuantity(1, 'roll', 'metric')).toBe('1 roll');
  });

  it('leaves the pack line empty for rolls', () => {
    expect(formatPackLine({ ...paint, unit: 'roll', key: 'wallpaper' }, 'metric')).toBe('');
  });
});
