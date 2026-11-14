/**
 * Draws a ShoppingList into the results section (PRD Rules 3 and 6, NV3; TDD §E).
 *
 * Markup lives in ShoppingList.astro and MaterialCard.astro. This file clones the card
 * <template> once per material and fills it with text through dom.ts, so a room name or
 * any other text can never become markup. It never calculates a quantity: the buy number
 * is the whole-pack count that shoppingList.ts already rounded up once, and it is shown
 * before the exact need.
 *
 * Cards are updated in place and keyed by material, so a price field the visitor is
 * typing in keeps its value and focus while the list re-renders.
 */
import type { AssumptionLine, MaterialResult, ShoppingList } from '../../types/calc';
import type { UnitSystem } from '../../types/project';
import { litresToUsGal, m2ToSqFt, roundTo } from '../calc';
import { select, selectAll, setText } from './dom';

const CARD_ATTR = 'data-material-card';

type Unit = MaterialResult['unit'];

const PACK_NOUN: Record<MaterialResult['key'], readonly [string, string]> = {
  paint: ['can', 'cans'],
  ceilingPaint: ['can', 'cans'],
  primer: ['can', 'cans'],
  flooring: ['box', 'boxes'],
  tile: ['box', 'boxes'],
  wallpaper: ['roll', 'rolls'],
};

const num = (value: number): string => String(roundTo(value, 2));

/** A quantity with its unit for the visitor's unit system, for example "9.4 L" or "101 sq ft". */
export function formatQuantity(value: number, unit: Unit, system: UnitSystem): string {
  const imperial = system === 'imperial';
  if (unit === 'L') return imperial ? `${num(litresToUsGal(value))} US gal` : `${num(value)} L`;
  if (unit === 'm2') return imperial ? `${num(m2ToSqFt(value))} sq ft` : `${num(value)} m²`;
  return `${num(value)} ${value === 1 ? 'roll' : 'rolls'}`;
}

/** "5 cans", "1 box": the whole-pack count with a unit noun. */
export function formatBuy(item: MaterialResult): { value: string; unit: string } {
  const [one, many] = PACK_NOUN[item.key];
  return { value: String(item.buyQuantity), unit: item.buyQuantity === 1 ? one : many };
}

/** "2 × 10 L + 1 × 1 L. Covers 21 L.", empty for rolls, which are already whole units. */
export function formatPackLine(item: MaterialResult, system: UnitSystem): string {
  if (item.unit === 'roll' || item.packBreakdown.length === 0) return '';
  const parts = item.packBreakdown.map(
    (line) => `${line.count} × ${formatQuantity(line.packSize, item.unit, system)}`,
  );
  return `${parts.join(' + ')}. Covers ${formatQuantity(item.coveredQuantity, item.unit, system)}.`;
}

function stateNodes(container: ParentNode) {
  return {
    empty: select('[data-results-empty]', container),
    invalid: select('[data-results-invalid]', container),
    live: select('[data-results-live]', container),
    assumptionsLive: select('[data-assumptions-live]', container),
    assumptionsDefaults: select('[data-assumptions-defaults]', container),
  };
}

function setState(container: ParentNode, state: 'empty' | 'invalid' | 'live'): void {
  const nodes = stateNodes(container);
  if (nodes.empty) nodes.empty.hidden = state !== 'empty';
  if (nodes.invalid) nodes.invalid.hidden = state !== 'invalid';
  if (nodes.live) nodes.live.hidden = state !== 'live';
  const showLiveAssumptions = state === 'live';
  if (nodes.assumptionsLive) nodes.assumptionsLive.hidden = !showLiveAssumptions;
  if (nodes.assumptionsDefaults) nodes.assumptionsDefaults.hidden = showLiveAssumptions;
}

/** Show "enter your room" and clear any list. Used before the first calculation. */
export function renderEmpty(container: ParentNode): void {
  select('[data-card-list]', container)?.replaceChildren();
  select('[data-assumptions-live]', container)?.replaceChildren();
  setState(container, 'empty');
}

/** Show "fix the highlighted fields". The last good list is removed so it cannot be mistaken for current. */
export function renderInvalid(container: ParentNode): void {
  select('[data-card-list]', container)?.replaceChildren();
  select('[data-assumptions-live]', container)?.replaceChildren();
  setState(container, 'invalid');
}

function fillCard(card: HTMLElement, item: MaterialResult, system: UnitSystem): void {
  card.setAttribute(CARD_ATTR, item.key);
  setText(select('[data-card-title]', card), item.label);

  const buy = formatBuy(item);
  setText(select('[data-buy-value]', card), buy.value);
  setText(select('[data-buy-unit]', card), buy.unit);

  const packLine = select('[data-pack-line]', card);
  const packText = formatPackLine(item, system);
  setText(packLine, packText);
  if (packLine) packLine.hidden = packText === '';

  setText(select('[data-exact]', card), formatQuantity(item.exactQuantity, item.unit, system));

  const tiles = select('[data-tiles]', card);
  if (tiles) {
    tiles.hidden = item.tilesNeeded === undefined;
    setText(tiles, item.tilesNeeded === undefined ? '' : `About ${item.tilesNeeded} tiles`);
  }

  const priceInput = select('[data-price-input]', card);
  if (priceInput) priceInput.setAttribute('data-price-input', item.key);

  const cost = select('[data-cost]', card);
  if (cost) {
    cost.hidden = !item.cost;
    setText(select('[data-cost-value]', card), item.cost ? item.cost.formatted : '');
  }
}

function renderCards(container: ParentNode, list: ShoppingList): void {
  const cardList = select('[data-card-list]', container);
  const template = select<HTMLTemplateElement>('template[data-card-template]', container);
  if (!cardList || !template) return;

  const existing = new Map<string, HTMLElement>();
  for (const li of selectAll<HTMLElement>(':scope > li', cardList)) {
    const key = select(`[${CARD_ATTR}]`, li)?.getAttribute(CARD_ATTR);
    if (key) existing.set(key, li);
  }

  const wanted = new Set<string>(list.items.map((item) => item.key));
  for (const [key, li] of existing) {
    if (!wanted.has(key)) li.remove();
  }

  list.items.forEach((item, index) => {
    let li = existing.get(item.key);
    if (!li) {
      const clone = template.content.firstElementChild?.cloneNode(true);
      if (!(clone instanceof HTMLElement)) return;
      li = clone;
    }
    const card = select(`[${CARD_ATTR}]`, li);
    if (card) fillCard(card, item, list.unitSystem);
    // Only move a card that is out of place, so a focused price field is left alone.
    if (cardList.children[index] !== li) cardList.insertBefore(li, cardList.children[index] ?? null);
  });
}

function renderAssumptions(container: ParentNode, lines: readonly AssumptionLine[]): void {
  const target = select('[data-assumptions-live]', container);
  const template = select<HTMLTemplateElement>('template[data-assumption-template]', container);
  if (!target || !template) return;
  target.replaceChildren();
  for (const line of lines) {
    const clone = template.content.firstElementChild?.cloneNode(true);
    if (!(clone instanceof HTMLElement)) continue;
    setText(select('[data-assumption-label]', clone), line.label);
    setText(select('[data-assumption-value]', clone), line.value);
    const changed = select('[data-assumption-changed]', clone);
    if (changed) changed.hidden = !line.overridden;
    target.append(clone);
  }
}

/**
 * Render a list into the `[data-results]` section. All text is set as text, never markup.
 * A list with no items shows the empty message.
 */
export function renderShoppingList(container: ParentNode, list: ShoppingList): void {
  if (list.items.length === 0) {
    renderEmpty(container);
    return;
  }
  setText(select('[data-result-room-count]', container), String(list.roomCount));
  renderCards(container, list);
  renderAssumptions(container, list.assumptions);

  const total = select('[data-total]', container);
  if (total) {
    total.hidden = !list.totalCost;
    setText(select('[data-total-value]', container), list.totalCost ? list.totalCost.formatted : '');
  }
  setState(container, 'live');
}
