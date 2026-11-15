// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
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
