// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProjectStore } from '../../src/lib/state/projectStore';
import { bindRoomForm, parseDecimal, parsePackList } from '../../src/lib/ui/bindRoomForm';
import { FIXED_TIME } from '../helpers/roomFixtures';

function makeForm(mode: 'project' | 'single' = 'project'): HTMLFormElement {
  const form = document.createElement('form');
  form.setAttribute('data-room-form', '');
  form.dataset.mode = mode;
  const fields: Array<[string, string]> = [
    ['name', 'Bedroom'],
    ['length', '4'],
    ['width', '3.5'],
    ['height', '2.4'],
  ];
  for (const [key, value] of fields) {
    const input = document.createElement('input');
    input.setAttribute('data-field', key);
    input.value = value;
    form.append(input);
  }
  for (const key of ['name', 'length', 'width', 'height']) {
    const error = document.createElement('p');
    error.setAttribute('data-error-for', key);
    error.hidden = true;
    form.append(error);
  }
  const status = document.createElement('p');
  status.setAttribute('data-form-status', '');
  form.append(status);
  return form;
}

function fillRoomFields(form: HTMLFormElement): void {
  const values: Array<[string, string]> = [
    ['name', 'Bedroom'],
    ['length', '4'],
    ['width', '3.5'],
    ['height', '2.4'],
  ];
  for (const [key, value] of values) {
    const input = form.querySelector<HTMLInputElement>(`[data-field="${key}"]`);
    if (input) input.value = value;
  }
}

function makeStore() {
  const store = createProjectStore({
    storage: null,
    now: () => FIXED_TIME,
    newId: () => 'room-test',
    debounceMs: 60_000,
  });
  // The test inputs and assertions use metres; don't inherit the default region's units.
  store.setSettings({ unitSystem: 'metric' });
  return store;
}

describe('bindRoomForm parsing', () => {
  it('accepts plain decimals, comma decimals and leading minus signs', () => {
    expect(parseDecimal(' 4.25 ')).toBe(4.25);
    expect(parseDecimal('.5')).toBe(0.5);
    expect(parseDecimal('4,5')).toBe(4.5);
    expect(parseDecimal('-2')).toBe(-2);
  });

  it('rejects empty text, exponents and non-numeric input', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('   ')).toBeNull();
    expect(parseDecimal('1e3')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
  });

  it('parses comma, semicolon and whitespace separated pack sizes', () => {
    expect(parsePackList('1, 2.5; 5 10')).toEqual([1, 2.5, 5, 10]);
    expect(parsePackList('1.5; 2.5')).toEqual([1.5, 2.5]);
  });

  it('rejects an empty or partly invalid pack list', () => {
    expect(parsePackList('')).toBeNull();
    expect(parsePackList('1, nope, 5')).toBeNull();
  });
});

describe('bindRoomForm lifecycle and project flow', () => {
  it('returns null when the page has no room form', () => {
    expect(bindRoomForm({ root: document })).toBeNull();
  });

  it('saves a valid submitted room to the project store', () => {
    document.body.replaceChildren();
    const form = makeForm();
    document.body.append(form);
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });
    expect(unbind).toBeTypeOf('function');
    fillRoomFields(form);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(store.getState().rooms).toHaveLength(1);
    expect(store.getState().rooms[0]?.name).toBe('Bedroom');
    expect(store.getState().rooms[0]?.lengthM).toBe(4);
    expect(form.querySelector('[data-form-status]')?.textContent).toContain('up to date');
    unbind?.();
  });

  it('does not save an invalid room and exposes the field error on submit', () => {
    document.body.replaceChildren();
    const form = makeForm();
    document.body.append(form);
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });
    fillRoomFields(form);
    const length = form.querySelector<HTMLInputElement>('[data-field="length"]')!;
    length.value = 'not a number';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(store.getState().rooms).toHaveLength(0);
    const error = form.querySelector<HTMLElement>('[data-error-for="length"]')!;
    expect(error.hidden).toBe(false);
    expect(error.textContent).toContain('CALC_007');
    expect(length.getAttribute('aria-invalid')).toBe('true');
    unbind?.();
  });

  it('updates the saved room when a project field changes', () => {
    document.body.replaceChildren();
    const form = makeForm();
    document.body.append(form);
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });
    fillRoomFields(form);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const name = form.querySelector<HTMLInputElement>('[data-field="name"]')!;
    name.value = 'Main bedroom';
    name.dispatchEvent(new Event('input', { bubbles: true }));

    expect(store.getState().rooms).toHaveLength(1);
    expect(store.getState().rooms[0]?.name).toBe('Main bedroom');
    unbind?.();
  });

  it('keeps a single-calculator room transient instead of saving it', () => {
    document.body.replaceChildren();
    const form = makeForm('single');
    document.body.append(form);
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });
    fillRoomFields(form);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(store.getState().rooms).toHaveLength(0);
    unbind?.();
  });
});

/** A fuller page fixture for exercising the form's delegated UI interactions. */
function makeCompletePage(mode: 'project' | 'single' = 'project') {
  document.body.replaceChildren();
  const form = makeForm(mode);

  const addOption = (key: string): HTMLInputElement => {
    const input = document.createElement('input');
    input.dataset.option = key;
    form.append(input);
    const error = document.createElement('p');
    error.dataset.errorFor = key;
    error.hidden = true;
    form.append(error);
    return input;
  };

  const numericOptions = [
    'paint.coverage',
    'paint.spare',
    'flooring.waste',
    'flooring.box',
    'tile.width',
    'tile.height',
    'tile.grout',
    'tile.waste',
    'tile.box',
    'wallpaper.rollWidth',
    'wallpaper.rollLength',
    'wallpaper.spare',
    'paint.coats',
    'wallpaper.repeat',
    'paint.packs',
    'setting.includeCeiling',
    'setting.includePrimer',
  ];
  numericOptions.forEach(addOption);

  const selectOptions: Array<[string, string[]]> = [
    ['flooring.pattern', ['straight', 'diagonal', 'herringbone']],
    ['tile.pattern', ['straight', 'diagonal', 'herringbone']],
    ['tile.surface', ['floor', 'wall']],
  ];
  for (const [key, values] of selectOptions) {
    const select = document.createElement('select');
    select.dataset.option = key;
    for (const value of values) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    }
    form.append(select);
    const error = document.createElement('p');
    error.dataset.errorFor = key;
    error.hidden = true;
    form.append(error);
  }

  const openingsError = document.createElement('p');
  openingsError.dataset.errorFor = 'openings';
  openingsError.hidden = true;
  form.append(openingsError);

  const openingList = document.createElement('div');
  openingList.dataset.openingsList = '';
  form.append(openingList);

  const openingTemplate = document.createElement('template');
  openingTemplate.dataset.openingTemplate = '';
  const openingRow = document.createElement('div');
  openingRow.dataset.openingRow = '';

  const kind = document.createElement('select');
  kind.dataset.openingField = 'kind';
  for (const value of ['door', 'window']) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    kind.append(option);
  }
  openingRow.append(kind);

  const openingFields: Array<[string, string]> = [
    ['width', '0.9'],
    ['height', '2'],
    ['count', '1'],
  ];
  for (const [key, value] of openingFields) {
    const input = document.createElement('input');
    input.dataset.openingField = key;
    input.value = value;
    openingRow.append(input);
  }

  const openingError = document.createElement('p');
  openingError.dataset.openingError = '';
  openingRow.append(openingError);

  const removeOpening = document.createElement('button');
  removeOpening.type = 'button';
  removeOpening.dataset.removeOpening = '';
  openingRow.append(removeOpening);

  openingTemplate.content.append(openingRow);
  form.append(openingTemplate);

  const hiddenId = document.createElement('input');
  hiddenId.dataset.roomId = '';
  form.append(hiddenId);

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.dataset.cancelEdit = '';
  form.append(cancel);

  const addRoom = document.createElement('button');
  addRoom.type = 'button';
  addRoom.dataset.addRoom = '';
  form.append(addRoom);

  const addOpening = document.createElement('button');
  addOpening.type = 'button';
  addOpening.dataset.addOpening = '';
  form.append(addOpening);

  const roomList = document.createElement('section');
  roomList.dataset.roomList = '';

  const roomCount = document.createElement('span');
  roomCount.dataset.roomCount = '';
  roomList.append(roomCount);

  const roomEmpty = document.createElement('p');
  roomEmpty.dataset.roomEmpty = '';
  roomList.append(roomEmpty);

  const roomItems = document.createElement('div');
  roomItems.dataset.roomItems = '';
  roomList.append(roomItems);

  const roomTemplate = document.createElement('template');
  roomTemplate.dataset.roomItemTemplate = '';
  const roomItem = document.createElement('article');
  roomItem.dataset.roomItem = '';

  for (const selector of ['roomName', 'roomSize'] as const) {
    const node = document.createElement('span');
    node.dataset[selector] = '';
    roomItem.append(node);
  }

  for (const key of ['editRoom', 'removeRoom'] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset[key] = '';
    roomItem.append(button);
  }

  roomTemplate.content.append(roomItem);
  roomList.append(roomTemplate);

  const clearData = document.createElement('button');
  clearData.type = 'button';
  clearData.dataset.clearData = '';
  roomList.append(clearData);

  const results = document.createElement('section');
  results.dataset.results = '';

  const states: Array<[string, boolean]> = [
    ['results-empty', false],
    ['results-invalid', true],
    ['results-live', true],
    ['assumptions-live', true],
    ['assumptions-defaults', false],
  ];
  for (const [key, hidden] of states) {
    const node = document.createElement('div');
    node.setAttribute('data-' + key, '');
    node.hidden = hidden;
    results.append(node);
  }

  const cardList = document.createElement('ul');
  cardList.dataset.cardList = '';
  results.append(cardList);

  const cardTemplate = document.createElement('template');
  cardTemplate.dataset.cardTemplate = '';
  const li = document.createElement('li');
  const card = document.createElement('article');
  card.dataset.materialCard = '';

  const cardFields = [
    'card-title',
    'buy-value',
    'buy-unit',
    'pack-line',
    'exact',
    'price-label',
    'price-error',
    'cost',
    'cost-value',
  ];
  for (const key of cardFields) {
    const node = document.createElement('span');
    node.setAttribute('data-' + key, '');
    card.append(node);
  }

  const price = document.createElement('input');
  price.dataset.priceInput = '';
  card.append(price);
  li.append(card);
  cardTemplate.content.append(li);
  results.append(cardTemplate);

  const assumptionsTemplate = document.createElement('template');
  assumptionsTemplate.dataset.assumptionTemplate = '';
  const assumption = document.createElement('div');
  for (const key of ['assumption-label', 'assumption-value', 'assumption-changed']) {
    const node = document.createElement('span');
    node.setAttribute('data-' + key, '');
    assumption.append(node);
  }
  assumptionsTemplate.content.append(assumption);
  results.append(assumptionsTemplate);

  const addToProject = document.createElement('a');
  addToProject.dataset.addToProject = '';
  addToProject.href = '/project';

  document.body.append(form, roomList, results, addToProject);
  return { form, roomList, results, openingList, roomItems };
}

function click(target: Element): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

function submit(form: HTMLFormElement): void {
  fillRoomFields(form);
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('bindRoomForm DOM interactions', () => {
  it('adds and removes a valid opening row and saves its dimensions', () => {
    const page = makeCompletePage();
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });

    click(page.form.querySelector('[data-add-opening]')!);
    expect(page.openingList.querySelectorAll('[data-opening-row]')).toHaveLength(1);

    const row = page.openingList.querySelector<HTMLElement>('[data-opening-row]')!;
    const width = row.querySelector<HTMLInputElement>('[data-opening-field="width"]')!;
    width.value = '1.2';
    submit(page.form);

    expect(store.getState().rooms[0]?.openings[0]?.widthM).toBeCloseTo(1.2);

    click(row.querySelector('[data-remove-opening]')!);
    expect(page.openingList.querySelectorAll('[data-opening-row]')).toHaveLength(0);
    unbind?.();
  });

  it('shows an opening-row validation error and refuses to save it', () => {
    const page = makeCompletePage();
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });

    click(page.form.querySelector('[data-add-opening]')!);
    const row = page.openingList.querySelector<HTMLElement>('[data-opening-row]')!;
    row.querySelector<HTMLInputElement>('[data-opening-field="count"]')!.value = '1.5';
    submit(page.form);

    expect(store.getState().rooms).toHaveLength(0);
    expect(row.querySelector<HTMLElement>('[data-opening-error]')?.hidden).toBe(false);
    unbind?.();
  });

  it('renders the room list and supports editing, removing and adding a room', () => {
    const page = makeCompletePage();
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });

    submit(page.form);
    expect(page.roomList.querySelector('[data-room-count]')?.textContent).toBe('1');

    const item = page.roomItems.querySelector<HTMLElement>('[data-room-item]')!;
    click(item.querySelector('[data-edit-room]')!);
    expect(page.form.querySelector<HTMLElement>('[data-cancel-edit]')?.hidden).toBe(false);

    const name = page.form.querySelector<HTMLInputElement>('[data-field="name"]')!;
    name.value = 'Edited bedroom';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    expect(store.getState().rooms[0]?.name).toBe('Edited bedroom');

    const updatedItem = page.roomItems.querySelector<HTMLElement>('[data-room-item]')!;
    click(updatedItem.querySelector('[data-remove-room]')!);
    expect(store.getState().rooms).toHaveLength(0);

    click(page.form.querySelector('[data-add-room]')!);
    expect(page.form.querySelector<HTMLInputElement>('[data-field="length"]')?.value).toBe('');
    unbind?.();
  });

  it('clears the project only after confirmation', () => {
    const page = makeCompletePage();
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });
    submit(page.form);

    const confirm = vi.spyOn(window, 'confirm');
    confirm.mockReturnValueOnce(false).mockReturnValueOnce(true);

    click(page.roomList.querySelector('[data-clear-data]')!);
    expect(store.getState().rooms).toHaveLength(1);

    click(page.roomList.querySelector('[data-clear-data]')!);
    expect(store.getState().rooms).toHaveLength(0);
    unbind?.();
  });

  it('validates material options and applies pattern waste presets', () => {
    const page = makeCompletePage();
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });
    submit(page.form);

    const pattern = page.form.querySelector<HTMLSelectElement>('[data-option="flooring.pattern"]')!;
    pattern.value = 'diagonal';
    pattern.dispatchEvent(new Event('change', { bubbles: true }));
    expect(store.getState().rooms[0]?.flooring.layPattern).toBe('diagonal');

    const coats = page.form.querySelector<HTMLInputElement>('[data-option="paint.coats"]')!;
    coats.value = '0';
    coats.dispatchEvent(new Event('input', { bubbles: true }));
    expect(page.form.querySelector<HTMLElement>('[data-error-for="paint.coats"]')?.hidden).toBe(
      false,
    );

    const ceiling = page.form.querySelector<HTMLInputElement>(
      '[data-option="setting.includeCeiling"]',
    )!;
    ceiling.checked = true;
    ceiling.dispatchEvent(new Event('change', { bubbles: true }));
    expect(store.getState().settings.includeCeiling).toBe(true);
    unbind?.();
  });

  it('converts dimensions and unit labels when project units change', () => {
    const page = makeCompletePage();
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });
    submit(page.form);

    store.setSettings({ unitSystem: 'imperial' });
    const length = page.form.querySelector<HTMLInputElement>('[data-field="length"]')!;
    expect(Number(length.value)).toBeCloseTo(13.1234, 1);
    expect(page.form.querySelector('[data-unit-label="length"]')?.textContent).toBe('ft');
    unbind?.();
  });

  it('accepts, rejects and clears material prices', () => {
    const page = makeCompletePage();
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });
    submit(page.form);

    const price = page.results.querySelector<HTMLInputElement>('[data-price-input]')!;
    expect(price).toBeTruthy();

    price.value = '12.50';
    price.dispatchEvent(new Event('input', { bubbles: true }));
    expect(Object.values(store.getState().settings.prices)).toContain(12.5);

    price.value = 'not-a-price';
    price.dispatchEvent(new Event('input', { bubbles: true }));
    expect(page.results.querySelector<HTMLElement>('[data-price-error]')?.hidden).toBe(false);

    price.value = '';
    price.dispatchEvent(new Event('input', { bubbles: true }));
    expect(Object.keys(store.getState().settings.prices)).toHaveLength(0);
    unbind?.();
  });

  it('loads a valid single-calculator preset without saving it', () => {
    const page = makeCompletePage('single');
    page.form.dataset.preset = JSON.stringify({
      name: 'Preset room',
      lengthM: 5,
      widthM: 4,
      heightM: 2.5,
    });
    const store = makeStore();
    const unbind = bindRoomForm({ root: document, store });

    expect(page.form.querySelector<HTMLInputElement>('[data-field="name"]')?.value).toBe(
      'Preset room',
    );
    expect(store.getState().rooms).toHaveLength(0);
    expect(page.results.querySelector<HTMLElement>('[data-results-live]')?.hidden).toBe(false);
    unbind?.();
  });

  it('falls back to a blank single-calculator form for malformed presets', () => {
    const page = makeCompletePage('single');
    page.form.dataset.preset = '{not valid json';
    const unbind = bindRoomForm({
      root: document,
      store: makeStore(),
    });

    expect(page.form.querySelector<HTMLInputElement>('[data-field="length"]')?.value).toBe('');
    expect(page.results.querySelector<HTMLElement>('[data-results-empty]')?.hidden).toBe(false);
    unbind?.();
  });

  it('flushes on pagehide and detaches listeners when unbound', () => {
    const page = makeCompletePage();
    const store = makeStore();
    const flush = vi.spyOn(store, 'flush');
    const unbind = bindRoomForm({ root: document, store });

    window.dispatchEvent(new Event('pagehide'));
    expect(flush).toHaveBeenCalledTimes(1);

    unbind?.();
    window.dispatchEvent(new Event('pagehide'));
    expect(flush).toHaveBeenCalledTimes(1);

    click(page.form.querySelector('[data-add-room]')!);
    expect(page.form.querySelector<HTMLInputElement>('[data-field="length"]')?.value).toBe('');
  });
});
