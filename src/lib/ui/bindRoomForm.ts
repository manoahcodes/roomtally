/**
 * Connects the room form to the store and the results (PRD Rules 1, 7, 8; App_Flow §B.7).
 *
 * Pipeline (TDD §B.8): read the form in the visitor's units, convert to metres and litres,
 * validate every field, save a valid room to the store, then draw the list.
 *
 * Modes (data-mode on the form):
 *  - "project" (home page): a valid room is saved to the store on every change, so rooms
 *    add up into one list. Returning visitors get their first saved room back in the form.
 *  - "single" (calculator pages): the room lives in memory only, so visiting several
 *    calculator pages never fills the saved project. "Add to my whole project"
 *    ([data-add-to-project]) saves it on request. Only data-material's card is listed.
 *
 * Errors: a field shows its fixed message from TDD §G.48 and the code, only after the
 * visitor has touched it or pressed Calculate. Invalid input never produces a result:
 * the results area shows "Fix the highlighted fields" instead. Nothing here reads or
 * writes markup; text goes through dom.ts and renderResults.ts.
 */
import {
  DEFAULT_COATS,
  LAY_PATTERNS,
  PAINT_SPARE_PCT,
  WALLPAPER_SPARE_PCT,
  WASTE_PCT_BY_PATTERN,
  boxCoverageM2,
  defaultPaintOptions,
  defaultTileOptions,
  defaultWallpaperOptions,
  paintCoverageM2PerL,
} from '../../data/materials';
import type { MaterialKey, ShoppingList } from '../../types/calc';
import type {
  LayPattern,
  Opening,
  PriceKey,
  Project,
  Room,
  Settings,
  UnitSystem,
} from '../../types/project';
import {
  CalcValidationError,
  ERRORS,
  LIMITS,
  L_PER_US_GAL,
  M2_PER_SQFT,
  buildShoppingList,
  describeForLog,
  formatMessage,
  inToM,
  m2ToSqFt,
  mToIn,
  sqFtToM2,
  validateOpenings,
  validateRoom,
} from '../calc';
import type { ErrorCode, MessageParams } from '../calc';
import { getProjectStore } from '../state/projectStore';
import type { ProjectStore, RoomInput } from '../state/projectStore';
import { createDefaultRoomInput } from '../state/projectStore';
import { track } from './analytics';
import { clear, select, selectAll, setText } from './dom';
import { renderEmpty, renderInvalid, renderShoppingList } from './renderResults';
import {
  areaFromDisplay,
  areaToDisplay,
  formatNumber,
  lengthFromDisplay,
  lengthToDisplay,
  volumeFromDisplay,
  volumeToDisplay,
} from './unitToggle';

/* ---------- units ---------- */

type UnitKind = 'length' | 'small-length' | 'roll-width' | 'area' | 'coverage' | 'volume' | 'percent';

const UNIT_LABELS: Record<UnitKind, Record<UnitSystem, string>> = {
  length: { metric: 'm', imperial: 'ft' },
  'small-length': { metric: 'mm', imperial: 'in' },
  'roll-width': { metric: 'm', imperial: 'in' },
  area: { metric: 'm²', imperial: 'sq ft' },
  coverage: { metric: 'm² per litre', imperial: 'sq ft per US gal' },
  volume: { metric: 'L', imperial: 'US gal' },
  percent: { metric: '%', imperial: '%' },
};

const isImperial = (system: UnitSystem): boolean => system === 'imperial';

/** Stored (metres, m², litres) to the number shown in the field. */
function toDisplay(kind: UnitKind, value: number, system: UnitSystem): number {
  switch (kind) {
    case 'length':
      return lengthToDisplay(value, system);
    case 'small-length':
      return isImperial(system) ? mToIn(value) : value * 1000;
    case 'roll-width':
      return isImperial(system) ? mToIn(value) : value;
    case 'area':
      return areaToDisplay(value, system);
    case 'coverage':
      return isImperial(system) ? m2ToSqFt(value * L_PER_US_GAL) : value;
    case 'volume':
      return volumeToDisplay(value, system);
    case 'percent':
      return value;
  }
}

/** The number typed in the field back to stored units. */
function fromDisplay(kind: UnitKind, value: number, system: UnitSystem): number {
  switch (kind) {
    case 'length':
      return lengthFromDisplay(value, system);
    case 'small-length':
      return isImperial(system) ? inToM(value) : value / 1000;
    case 'roll-width':
      return isImperial(system) ? inToM(value) : value;
    case 'area':
      return areaFromDisplay(value, system);
    case 'coverage':
      return isImperial(system) ? sqFtToM2(value) / L_PER_US_GAL : value;
    case 'volume':
      return volumeFromDisplay(value, system);
    case 'percent':
      return value;
  }
}

const show = (kind: UnitKind, stored: number, system: UnitSystem): string =>
  formatNumber(toDisplay(kind, stored, system), 5);

const withUnit = (kind: UnitKind, stored: number, system: UnitSystem): string =>
  `${formatNumber(toDisplay(kind, stored, system), 2)} ${UNIT_LABELS[kind][system]}`;

/* ---------- parsing ---------- */

/**
 * A plain decimal typed by a person. Accepts "4", "4.5", ".5", "4,5" and a leading minus.
 * Rejects empty text, letters, exponents and anything else (CALC_007).
 */
export function parseDecimal(text: string): number | null {
  const compact = text.trim().replace(/\s+/g, '');
  if (compact === '') return null;
  const normal = /^-?\d+,\d+$/.test(compact) ? compact.replace(',', '.') : compact;
  if (!/^-?(\d*\.?\d+|\d+\.)$/.test(normal)) return null;
  const value = Number(normal);
  return Number.isFinite(value) ? value : null;
}

/** "1, 2.5, 5, 10" to numbers. Null when empty or when any part is not a number. */
export function parsePackList(text: string): number[] | null {
  const parts = text.split(/[,;\s]+/).filter((part) => part !== '');
  if (parts.length === 0) return null;
  const values: number[] = [];
  for (const part of parts) {
    const value = parseDecimal(part);
    if (value === null) return null;
    values.push(value);
  }
  return values;
}

/** Message text with its code, as shown next to a field (PRD Rule 8). */
function message(code: ErrorCode, params: MessageParams = {}): string {
  return `${formatMessage(ERRORS[code].userMessage, params)} (${code})`;
}

/* ---------- field tables ---------- */

type Rule =
  | { kind: 'range'; min: number; max: number; code?: ErrorCode }
  | { kind: 'positive'; max: number };

interface NumField {
  key: string;
  unit: UnitKind;
  rule: Rule;
  get(room: RoomInput): number;
  set(room: RoomInput, value: number): void;
}

const PERCENT: Rule = { kind: 'range', min: LIMITS.wasteMin, max: LIMITS.wasteMax, code: 'CALC_005' };

const NUM_FIELDS: readonly NumField[] = [
  {
    key: 'paint.coverage',
    unit: 'coverage',
    rule: { kind: 'positive', max: LIMITS.coverageMax },
    get: (r) => r.paint.coverageM2PerL,
    set: (r, v) => void (r.paint.coverageM2PerL = v),
  },
  {
    key: 'paint.spare',
    unit: 'percent',
    rule: PERCENT,
    get: (r) => r.paint.wasteSparePct,
    set: (r, v) => void (r.paint.wasteSparePct = v),
  },
  {
    key: 'flooring.waste',
    unit: 'percent',
    rule: PERCENT,
    get: (r) => r.flooring.wastePct,
    set: (r, v) => void (r.flooring.wastePct = v),
  },
  {
    key: 'flooring.box',
    unit: 'area',
    rule: { kind: 'positive', max: LIMITS.coverageMax },
    get: (r) => r.flooring.boxCoverageM2,
    set: (r, v) => void (r.flooring.boxCoverageM2 = v),
  },
  {
    key: 'tile.width',
    unit: 'small-length',
    rule: { kind: 'positive', max: LIMITS.sizeMaxM },
    get: (r) => r.tile.tileWidthM,
    set: (r, v) => void (r.tile.tileWidthM = v),
  },
  {
    key: 'tile.height',
    unit: 'small-length',
    rule: { kind: 'positive', max: LIMITS.sizeMaxM },
    get: (r) => r.tile.tileHeightM,
    set: (r, v) => void (r.tile.tileHeightM = v),
  },
  {
    key: 'tile.grout',
    unit: 'small-length',
    rule: { kind: 'range', min: 0, max: LIMITS.groutMaxM },
    get: (r) => r.tile.groutM,
    set: (r, v) => void (r.tile.groutM = v),
  },
  {
    key: 'tile.waste',
    unit: 'percent',
    rule: PERCENT,
    get: (r) => r.tile.wastePct,
    set: (r, v) => void (r.tile.wastePct = v),
  },
  {
    key: 'tile.box',
    unit: 'area',
    rule: { kind: 'positive', max: LIMITS.coverageMax },
    get: (r) => r.tile.boxCoverageM2,
    set: (r, v) => void (r.tile.boxCoverageM2 = v),
  },
  {
    key: 'wallpaper.rollWidth',
    unit: 'roll-width',
    rule: { kind: 'positive', max: LIMITS.sizeMaxM },
    get: (r) => r.wallpaper.rollWidthM,
    set: (r, v) => void (r.wallpaper.rollWidthM = v),
  },
  {
    key: 'wallpaper.rollLength',
    unit: 'length',
    rule: { kind: 'positive', max: LIMITS.sizeMaxM },
    get: (r) => r.wallpaper.rollLengthM,
    set: (r, v) => void (r.wallpaper.rollLengthM = v),
  },
  {
    key: 'wallpaper.spare',
    unit: 'percent',
    rule: PERCENT,
    get: (r) => r.wallpaper.wasteSparePct,
    set: (r, v) => void (r.wallpaper.wasteSparePct = v),
  },
];

const CORE_FIELDS = [
  { key: 'length', prop: 'lengthM', min: LIMITS.dimensionMinM, max: LIMITS.dimensionMaxM },
  { key: 'width', prop: 'widthM', min: LIMITS.dimensionMinM, max: LIMITS.dimensionMaxM },
  { key: 'height', prop: 'heightM', min: LIMITS.heightMinM, max: LIMITS.heightMaxM },
] as const;

const EPSILON = 1e-9;

function checkNumber(
  field: NumField,
  text: string,
  system: UnitSystem,
): { value: number } | { error: string } {
  const typed = parseDecimal(text);
  if (typed === null) return { error: message('CALC_007') };
  const stored = fromDisplay(field.unit, typed, system);
  const rule = field.rule;
  if (rule.kind === 'range') {
    if (stored < rule.min - EPSILON || stored > rule.max + EPSILON) {
      const code = rule.code ?? 'CALC_001';
      return {
        error:
          code === 'CALC_005'
            ? message(code)
            : message(code, {
                min: withUnit(field.unit, rule.min, system),
                max: withUnit(field.unit, rule.max, system),
              }),
      };
    }
  } else if (!(stored > 0) || stored > rule.max) {
    return {
      error: message('CALC_001', { min: '0', max: withUnit(field.unit, rule.max, system) }),
    };
  }
  return { value: stored };
}

/* ---------- reading the form ---------- */

interface ReadResult {
  room: RoomInput;
  errors: Map<string, string>;
  openingErrors: Map<number, string>;
}

type FormControl = HTMLInputElement | HTMLSelectElement;

const STAMP = '2026-01-01T00:00:00.000Z';

function isLayPattern(value: string): value is LayPattern {
  return (LAY_PATTERNS as readonly string[]).includes(value);
}

/* ---------- overrides, shown as "Changed" in the Assumptions panel ---------- */

function computeOverrides(rooms: readonly RoomInput[]): Record<string, number> {
  const out: Record<string, number> = {};
  const metric = {
    paint: defaultPaintOptions('metric'),
    tile: defaultTileOptions('metric'),
    wallpaper: defaultWallpaperOptions('metric'),
  };
  const imperial = {
    paint: defaultPaintOptions('imperial'),
    tile: defaultTileOptions('imperial'),
    wallpaper: defaultWallpaperOptions('imperial'),
  };
  // A value that matches either unit system's preset is not a change by the visitor.
  const differs = (actual: number, ...defaults: number[]): boolean =>
    !defaults.some((d) => Math.abs(actual - d) <= 1e-4 * Math.max(1, Math.abs(d)));
  const mark = (id: string, value: number): void => {
    // Settings only accept positive overrides, so a value of 0 cannot be flagged.
    if (value > 0) out[id] = value;
  };

  for (const room of rooms) {
    const { paint, flooring, tile, wallpaper } = room;
    if (differs(paint.coverageM2PerL, paintCoverageM2PerL('metric'), paintCoverageM2PerL('imperial'))) {
      mark('paint.coverage', paint.coverageM2PerL);
    }
    if (differs(paint.coats, DEFAULT_COATS)) mark('paint.coats', paint.coats);
    if (differs(paint.wasteSparePct, PAINT_SPARE_PCT)) mark('paint.spare', paint.wasteSparePct);

    if (differs(flooring.wastePct, WASTE_PCT_BY_PATTERN[flooring.layPattern])) {
      mark(`flooring.waste.${flooring.layPattern}`, flooring.wastePct);
    }
    if (differs(flooring.boxCoverageM2, boxCoverageM2('flooring', 'metric'), boxCoverageM2('flooring', 'imperial'))) {
      mark('flooring.box', flooring.boxCoverageM2);
    }

    if (
      differs(tile.tileWidthM, metric.tile.tileWidthM, imperial.tile.tileWidthM) ||
      differs(tile.tileHeightM, metric.tile.tileHeightM, imperial.tile.tileHeightM)
    ) {
      mark('tile.size', tile.tileWidthM);
    }
    if (differs(tile.groutM, metric.tile.groutM, imperial.tile.groutM)) mark('tile.grout', tile.groutM);
    if (differs(tile.wastePct, WASTE_PCT_BY_PATTERN[tile.layPattern])) {
      mark(`tile.waste.${tile.layPattern}`, tile.wastePct);
    }
    if (differs(tile.boxCoverageM2, boxCoverageM2('tile', 'metric'), boxCoverageM2('tile', 'imperial'))) {
      mark('tile.box', tile.boxCoverageM2);
    }

    if (differs(wallpaper.rollWidthM, metric.wallpaper.rollWidthM, imperial.wallpaper.rollWidthM)) {
      mark('wallpaper.roll.width', wallpaper.rollWidthM);
    }
    if (differs(wallpaper.rollLengthM, metric.wallpaper.rollLengthM, imperial.wallpaper.rollLengthM)) {
      mark('wallpaper.roll.length', wallpaper.rollLengthM);
    }
    if (differs(wallpaper.repeatM * 100, 0)) mark('wallpaper.repeat', wallpaper.repeatM * 100);
    if (differs(wallpaper.wasteSparePct, WALLPAPER_SPARE_PCT)) {
      mark('wallpaper.spare', wallpaper.wasteSparePct);
    }
  }
  return out;
}

/* ---------- prices ---------- */

const PRICE_KEYS: readonly string[] = [
  'paint',
  'ceilingPaint',
  'primer',
  'flooring',
  'tile',
  'wallpaper',
];

/** The unit a price is typed in, and how many stored units one shown unit holds. */
function priceUnit(key: MaterialKey, system: UnitSystem): { label: string; factor: number } {
  const imperial = isImperial(system);
  if (key === 'paint' || key === 'ceilingPaint' || key === 'primer') {
    return imperial ? { label: 'US gallon', factor: L_PER_US_GAL } : { label: 'litre', factor: 1 };
  }
  if (key === 'wallpaper') return { label: 'roll', factor: 1 };
  return imperial ? { label: 'sq ft', factor: M2_PER_SQFT } : { label: 'm²', factor: 1 };
}

/* ---------- public API ---------- */

export interface BindOptions {
  store?: ProjectStore;
  root?: ParentNode;
}

/**
 * Wire up the room form on the current page. Returns a function that removes every
 * listener, or null when the page has no room form.
 */
export function bindRoomForm(options: BindOptions = {}): (() => void) | null {
  const root = options.root ?? document;
  const form = select<HTMLFormElement>('[data-room-form]', root);
  if (!form) return null;
  const store = options.store ?? getProjectStore();

  const mode = form.dataset.mode === 'single' ? 'single' : 'project';
  const material = form.dataset.material;
  const resultsEl = select('[data-results]', root);
  const roomListEl = select('[data-room-list]', root);
  const statusEl = select('[data-form-status]', form);
  const noticeEl = select('[data-store-notice]', root);
  const cancelEl = select('[data-cancel-edit]', form);
  const hiddenId = select<HTMLInputElement>('[data-room-id]', form);
  const openingsList = select('[data-openings-list]', form);
  const openingTemplate = select<HTMLTemplateElement>('template[data-opening-template]', form);

  let base: RoomInput = createDefaultRoomInput(store.getState().settings, store.getState().rooms.length);
  let editingId: string | null = null;
  let transient: RoomInput | null = null;
  let lastSystem: UnitSystem = store.getState().settings.unitSystem;
  let submitted = false;
  let viewedTracked = false;
  let visibleErrors = 0;
  let hasErrors = false;
  const touched = new Set<string>();

  const optionEl = (key: string): FormControl | null =>
    select<FormControl>(`[data-option="${key}"]`, form);
  const fieldEl = (key: string): HTMLInputElement | null =>
    select<HTMLInputElement>(`[data-field="${key}"]`, form);

  /* --- reading --- */

  function readOpenings(
    room: RoomInput,
    system: UnitSystem,
    errors: Map<string, string>,
    rowErrors: Map<number, string>,
    dimsOk: boolean,
  ): void {
    const rows = selectAll('[data-opening-row]', form);
    const openings: Opening[] = [];
    let rowsOk = true;
    rows.forEach((row, index) => {
      const kindEl = select<HTMLSelectElement>('[data-opening-field="kind"]', row);
      const widthEl = select<HTMLInputElement>('[data-opening-field="width"]', row);
      const heightEl = select<HTMLInputElement>('[data-opening-field="height"]', row);
      const countEl = select<HTMLInputElement>('[data-opening-field="count"]', row);
      const kind = kindEl?.value === 'window' ? 'window' : 'door';
      const size = (el: HTMLInputElement | null, min: number, max: number): number | string => {
        const typed = el ? parseDecimal(el.value) : null;
        if (typed === null) return message('CALC_007');
        const metres = lengthFromDisplay(typed, system);
        if (metres < min - EPSILON || metres > max + EPSILON) {
          return message('CALC_001', {
            min: withUnit('length', min, system),
            max: withUnit('length', max, system),
          });
        }
        return metres;
      };
      const width = size(widthEl, LIMITS.openingWidthMinM, LIMITS.openingWidthMaxM);
      const height = size(heightEl, LIMITS.openingHeightMinM, LIMITS.openingHeightMaxM);
      const typedCount = countEl ? parseDecimal(countEl.value) : null;
      let count: number | string;
      if (typedCount === null) count = message('CALC_007');
      else if (
        !Number.isInteger(typedCount) ||
        typedCount < LIMITS.openingCountMin ||
        typedCount > LIMITS.openingCountMax
      ) {
        count = message('CALC_001', { min: LIMITS.openingCountMin, max: LIMITS.openingCountMax });
      } else count = typedCount;

      const problem = [width, height, count].find((v): v is string => typeof v === 'string');
      if (problem !== undefined) {
        rowErrors.set(index, problem);
        rowsOk = false;
        return;
      }
      openings.push({
        id: `op-${index + 1}`,
        kind,
        widthM: width as number,
        heightM: height as number,
        count: count as number,
      });
    });

    if (rows.length > LIMITS.maxOpenings) {
      errors.set('openings', message('CALC_008'));
      return;
    }
    if (!rowsOk) return;
    room.openings = openings;
    if (!dimsOk) return;
    try {
      validateOpenings(room);
    } catch (error) {
      if (error instanceof CalcValidationError && error.field === 'openings') {
        errors.set('openings', message(error.code, error.params));
      } else throw error;
    }
  }

  function readForm(system: UnitSystem): ReadResult {
    const room: RoomInput = structuredClone(base);
    const errors = new Map<string, string>();
    const openingErrors = new Map<number, string>();

    const name = fieldEl('name')?.value.trim() ?? '';
    if (name !== '') room.name = name.slice(0, LIMITS.nameMax);

    let dimsOk = true;
    for (const core of CORE_FIELDS) {
      const el = fieldEl(core.key);
      if (!el) continue;
      const typed = parseDecimal(el.value);
      if (typed === null) {
        errors.set(core.key, message('CALC_007'));
        dimsOk = false;
        continue;
      }
      const metres = lengthFromDisplay(typed, system);
      if (metres < core.min - EPSILON || metres > core.max + EPSILON) {
        errors.set(
          core.key,
          message('CALC_001', {
            min: withUnit('length', core.min, system),
            max: withUnit('length', core.max, system),
          }),
        );
        dimsOk = false;
        continue;
      }
      room[core.prop] = metres;
    }

    for (const field of NUM_FIELDS) {
      const el = optionEl(field.key);
      if (!el) continue;
      const result = checkNumber(field, el.value, system);
      if ('error' in result) errors.set(field.key, result.error);
      else field.set(room, result.value);
    }

    const coats = optionEl('paint.coats');
    if (coats) {
      const value = Number(coats.value);
      if (Number.isInteger(value) && value >= LIMITS.coatsMin && value <= LIMITS.coatsMax) {
        room.paint.coats = value;
      } else errors.set('paint.coats', message('CALC_004'));
    }

    const patterns: [string, 'flooring' | 'tile'][] = [
      ['flooring.pattern', 'flooring'],
      ['tile.pattern', 'tile'],
    ];
    for (const [key, group] of patterns) {
      const el = optionEl(key);
      if (!el) continue;
      if (isLayPattern(el.value)) room[group].layPattern = el.value;
      else errors.set(key, message('CALC_001', { min: LAY_PATTERNS[0] ?? '', max: LAY_PATTERNS[2] ?? '' }));
    }

    const surface = optionEl('tile.surface');
    if (surface) {
      if (surface.value === 'floor' || surface.value === 'wall') room.tile.surface = surface.value;
      else errors.set('tile.surface', message('CALC_001', { min: 'floor', max: 'wall' }));
    }

    const repeat = optionEl('wallpaper.repeat');
    if (repeat) {
      const cm = Number(repeat.value);
      if (Number.isFinite(cm) && cm >= 0 && cm / 100 <= LIMITS.repeatMaxM) room.wallpaper.repeatM = cm / 100;
      else errors.set('wallpaper.repeat', message('CALC_001', { min: '0 cm', max: '90 cm' }));
    }

    const packs = optionEl('paint.packs');
    if (packs) {
      const typed = parsePackList(packs.value);
      if (typed === null) errors.set('paint.packs', message('CALC_007'));
      else {
        const litres = typed.map((size) => fromDisplay('volume', size, system));
        if (litres.length > LIMITS.maxPackSizes) {
          errors.set('paint.packs', message('CALC_001', { min: 1, max: LIMITS.maxPackSizes }));
        } else if (litres.some((size) => !(size > 0) || size > LIMITS.coverageMax)) {
          errors.set(
            'paint.packs',
            message('CALC_001', { min: '0', max: withUnit('volume', LIMITS.coverageMax, system) }),
          );
        } else room.paint.packSizesL = litres;
      }
    }

    readOpenings(room, system, errors, openingErrors, dimsOk);

    if (errors.size === 0 && openingErrors.size === 0) {
      // Last line of defence: the same validators the store uses.
      try {
        validateRoom({ ...room, id: 'form', createdAt: STAMP, updatedAt: STAMP });
      } catch (error) {
        if (error instanceof CalcValidationError) {
          errors.set('form', message(error.code, error.params));
          console.warn(describeForLog(error.code, error.field));
        } else throw error;
      }
    }
    return { room, errors, openingErrors };
  }

  /* --- writing the form --- */

  function updateLabels(system: UnitSystem): void {
    for (const label of selectAll('[data-unit-label]', form)) {
      const kind = label.getAttribute('data-unit-label') as UnitKind | null;
      if (kind && kind in UNIT_LABELS) setText(label, UNIT_LABELS[kind][system]);
    }
  }

  function addOpeningRow(opening: Opening | null, system: UnitSystem): HTMLElement | null {
    const clone = openingTemplate?.content.firstElementChild?.cloneNode(true);
    if (!(clone instanceof HTMLElement) || !openingsList) return null;
    const set = (name: string, value: string): void => {
      const el = select<FormControl>(`[data-opening-field="${name}"]`, clone);
      if (el) el.value = value;
    };
    set('kind', opening?.kind ?? 'door');
    set('width', show('length', opening?.widthM ?? 0.9, system));
    set('height', show('length', opening?.heightM ?? 2, system));
    set('count', String(opening?.count ?? 1));
    openingsList.append(clone);
    return clone;
  }

  function populateForm(room: RoomInput, settings: Settings, blankDims: boolean): void {
    const system = settings.unitSystem;
    const name = fieldEl('name');
    if (name) name.value = room.name;
    for (const core of CORE_FIELDS) {
      const el = fieldEl(core.key);
      if (el) el.value = blankDims ? '' : show('length', room[core.prop], system);
    }
    for (const field of NUM_FIELDS) {
      const el = optionEl(field.key);
      if (el) el.value = show(field.unit, field.get(room), system);
    }
    const setOption = (key: string, value: string): void => {
      const el = optionEl(key);
      if (el) el.value = value;
    };
    setOption('paint.coats', String(room.paint.coats));
    setOption('flooring.pattern', room.flooring.layPattern);
    setOption('tile.pattern', room.tile.layPattern);
    setOption('tile.surface', room.tile.surface);
    setOption('wallpaper.repeat', String(Math.round(room.wallpaper.repeatM * 100)));
    setOption(
      'paint.packs',
      room.paint.packSizesL.map((size) => show('volume', size, system)).join(', '),
    );
    const ceiling = optionEl('setting.includeCeiling');
    if (ceiling instanceof HTMLInputElement) ceiling.checked = settings.includeCeiling;
    const primer = optionEl('setting.includePrimer');
    if (primer instanceof HTMLInputElement) primer.checked = settings.includePrimer;

    if (openingsList) clear(openingsList);
    for (const opening of room.openings) addOpeningRow(opening, system);
    updateLabels(system);
  }

  function showErrors(result: ReadResult | null): void {
    visibleErrors = 0;
    hasErrors = result !== null && (result.errors.size > 0 || result.openingErrors.size > 0);
    const visible = (key: string): boolean => submitted || touched.has(key);

    for (const slot of selectAll('[data-error-for]', form)) {
      const key = slot.getAttribute('data-error-for') ?? '';
      const text = result && visible(key) ? (result.errors.get(key) ?? '') : '';
      setText(slot, text);
      slot.hidden = text === '';
      if (text !== '') visibleErrors += 1;
      const control = key === 'openings' ? null : (fieldEl(key) ?? optionEl(key));
      if (control) {
        if (text === '') control.removeAttribute('aria-invalid');
        else control.setAttribute('aria-invalid', 'true');
      }
    }
    selectAll('[data-opening-row]', form).forEach((row, index) => {
      const slot = select('[data-opening-error]', row);
      const text = result && visible('openings') ? (result.openingErrors.get(index) ?? '') : '';
      setText(slot, text);
      if (slot) slot.hidden = text === '';
      if (text !== '') visibleErrors += 1;
    });
    const formError = result && submitted ? (result.errors.get('form') ?? '') : '';
    if (formError !== '') visibleErrors += 1;
    setText(statusEl, formError);
  }

  /* --- rendering --- */

  function renderRoomList(project: Project): void {
    if (!roomListEl) return;
    const items = select('[data-room-items]', roomListEl);
    const template = select<HTMLTemplateElement>('template[data-room-item-template]', roomListEl);
    setText(select('[data-room-count]', roomListEl), String(project.rooms.length));
    const empty = select('[data-room-empty]', roomListEl);
    if (empty) empty.hidden = project.rooms.length > 0;
    if (!items || !template) return;
    items.replaceChildren();
    const system = project.settings.unitSystem;
    for (const room of project.rooms) {
      const clone = template.content.firstElementChild?.cloneNode(true);
      if (!(clone instanceof HTMLElement)) continue;
      clone.setAttribute('data-room-id', room.id);
      if (room.id === editingId) clone.setAttribute('aria-current', 'true');
      setText(select('[data-room-name]', clone), room.name);
      const size = [room.lengthM, room.widthM, room.heightM]
        .map((metres) => show('length', metres, system))
        .join(' × ');
      setText(select('[data-room-size]', clone), `${size} ${UNIT_LABELS.length[system]}`);
      items.append(clone);
    }
  }

  function renderNotice(): void {
    if (!noticeEl) return;
    const notice = store.getNotice();
    setText(noticeEl, notice ? ERRORS[notice].userMessage : '');
    noticeEl.hidden = notice === null;
  }

  function updatePrices(settings: Settings): void {
    if (!resultsEl) return;
    for (const input of selectAll<HTMLInputElement>('[data-price-input]', resultsEl)) {
      const key = input.getAttribute('data-price-input') ?? '';
      if (!PRICE_KEYS.includes(key)) continue;
      const unit = priceUnit(key as MaterialKey, settings.unitSystem);
      const card = input.closest('[data-material-card]');
      setText(select('[data-price-label]', card ?? resultsEl), `Price per ${unit.label} (optional)`);
      if (document.activeElement === input) continue;
      const stored = settings.prices[key as PriceKey];
      input.value = stored === undefined ? '' : formatNumber(stored * unit.factor, 4);
    }
  }

  function buildList(rooms: readonly RoomInput[], settings: Settings): ShoppingList | null {
    const stamped: Room[] = rooms.map((room, index) => ({
      ...structuredClone(room),
      id: `r${index + 1}`,
      createdAt: STAMP,
      updatedAt: STAMP,
    }));
    const enabled = mode === 'single' && material ? [material] : settings.enabledMaterials;
    try {
      return buildShoppingList({
        schemaVersion: 1,
        rooms: stamped,
        createdAt: STAMP,
        updatedAt: STAMP,
        settings: {
          ...settings,
          enabledMaterials: enabled as Settings['enabledMaterials'],
          overrides: computeOverrides(rooms),
        },
      });
    } catch (error) {
      if (error instanceof CalcValidationError) {
        console.warn(describeForLog(error.code, error.field));
        return null;
      }
      throw error;
    }
  }

  function renderResultsNow(project: Project): void {
    if (!resultsEl) return;
    if (visibleErrors > 0) {
      renderInvalid(resultsEl);
      return;
    }
    const rooms: RoomInput[] = mode === 'single' ? (transient ? [transient] : []) : project.rooms;
    if (rooms.length === 0 || (mode === 'single' && hasErrors)) {
      renderEmpty(resultsEl);
      return;
    }
    const list = buildList(rooms, project.settings);
    if (!list) {
      renderInvalid(resultsEl);
      return;
    }
    renderShoppingList(resultsEl, list);
    updatePrices(project.settings);
    if (!viewedTracked && list.items.length > 0) {
      viewedTracked = true;
      track('shopping_list_viewed', {
        materials: list.items.map((item) => item.key).join(','),
        room_count: list.roomCount,
      });
    }
  }

  /** Re-show an unfocused field's text in the new units when the visitor switches units. */
  function convertDisplayed(from: UnitSystem, to: UnitSystem): void {
    const convert = (el: FormControl | null, kind: UnitKind): void => {
      if (!el) return;
      const typed = parseDecimal(el.value);
      if (typed === null) return;
      el.value = show(kind, fromDisplay(kind, typed, from), to);
    };
    for (const core of CORE_FIELDS) convert(fieldEl(core.key), 'length');
    for (const field of NUM_FIELDS) if (field.unit !== 'percent') convert(optionEl(field.key), field.unit);
    for (const row of selectAll('[data-opening-row]', form)) {
      convert(select<HTMLInputElement>('[data-opening-field="width"]', row), 'length');
      convert(select<HTMLInputElement>('[data-opening-field="height"]', row), 'length');
    }
    const packs = optionEl('paint.packs');
    if (packs) {
      const typed = parsePackList(packs.value);
      if (typed) {
        packs.value = typed
          .map((size) => show('volume', fromDisplay('volume', size, from), to))
          .join(', ');
      }
    }
  }

  function refresh(): void {
    const project = store.getState();
    const system = project.settings.unitSystem;
    if (system !== lastSystem) {
      convertDisplayed(lastSystem, system);
      lastSystem = system;
    }
    updateLabels(system);
    renderRoomList(project);
    renderNotice();
    if (cancelEl) cancelEl.hidden = editingId === null;
    renderResultsNow(project);
  }

  /* --- acting on the form --- */

  function loadRoom(room: RoomInput | null, id: string | null, blankDims: boolean): void {
    const project = store.getState();
    base = room ? structuredClone(room) : createDefaultRoomInput(project.settings, project.rooms.length);
    editingId = id;
    if (hiddenId) hiddenId.value = id ?? '';
    touched.clear();
    submitted = false;
    populateForm(base, project.settings, blankDims);
    showErrors(null);
    transient = null;
  }

  function stripRoom(room: Room): RoomInput {
    const input: Partial<Room> = structuredClone(room);
    delete input.id;
    delete input.createdAt;
    delete input.updatedAt;
    return input as RoomInput;
  }

  function saveRoom(room: RoomInput): void {
    const before = store.getState();
    try {
      if (editingId) {
        try {
          store.updateRoom(editingId, room);
          return;
        } catch (error) {
          if (!(error instanceof RangeError)) throw error;
          editingId = null; // That room was removed elsewhere; save this one as a new room.
        }
      }
      const saved = store.addRoom(room);
      editingId = saved.id;
      if (hiddenId) hiddenId.value = saved.id;
      const count = before.rooms.length + 1;
      if (before.rooms.length === 0) {
        track('first_room_entered', {
          region: before.settings.region,
          unit_system: before.settings.unitSystem,
        });
      }
      track('room_added', { room_count: count });
    } catch (error) {
      if (error instanceof CalcValidationError) {
        setText(statusEl, message(error.code, error.params));
        console.warn(describeForLog(error.code, error.field));
      } else throw error;
    }
  }

  function readAndApply(): ReadResult {
    const system = store.getState().settings.unitSystem;
    const result = readForm(system);
    showErrors(result);
    const clean = result.errors.size === 0 && result.openingErrors.size === 0;
    if (clean) {
      base = structuredClone(result.room);
      if (mode === 'single') {
        transient = result.room;
        refresh();
      } else {
        saveRoom(result.room); // The store notifies, which calls refresh().
        refresh();
      }
    } else {
      transient = null;
      refresh();
    }
    return result;
  }

  function onFormEvent(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const option = target.closest<HTMLElement>('[data-option]')?.getAttribute('data-option');
    const core = target.closest<HTMLElement>('[data-field]')?.getAttribute('data-field');
    const inOpening = target.closest('[data-opening-row]') !== null;
    if (option === 'setting.includeCeiling' || option === 'setting.includePrimer') {
      if (event.type === 'change' && target instanceof HTMLInputElement) {
        store.setSettings(
          option === 'setting.includeCeiling'
            ? { includeCeiling: target.checked }
            : { includePrimer: target.checked },
        );
      }
      return;
    }
    if (option) touched.add(option);
    if (core) touched.add(core);
    if (inOpening) touched.add('openings');
    if (!option && !core && !inOpening) return;

    // Choosing a lay pattern also sets that pattern's preset waste, which can be changed after.
    if (event.type === 'change' && (option === 'flooring.pattern' || option === 'tile.pattern')) {
      const group = option === 'flooring.pattern' ? 'flooring' : 'tile';
      const pattern = (target as FormControl).value;
      const waste = optionEl(`${group}.waste`);
      if (waste && isLayPattern(pattern)) waste.value = String(WASTE_PCT_BY_PATTERN[pattern]);
    }
    readAndApply();
  }

  function onSubmit(event: Event): void {
    event.preventDefault();
    submitted = true;
    const result = readAndApply();
    const clean = result.errors.size === 0 && result.openingErrors.size === 0;
    if (!clean) {
      const first = select<HTMLElement>('[aria-invalid="true"]', form);
      first?.focus();
      setText(statusEl, 'Fix the highlighted fields to see your list.');
    } else if (!statusEl?.textContent) {
      // A save error (for example the 10 room limit) stays visible instead.
      setText(statusEl, 'Your list is up to date below.');
    }
  }

  function onFormClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const system = store.getState().settings.unitSystem;
    if (target.closest('[data-add-opening]')) {
      if (selectAll('[data-opening-row]', form).length >= LIMITS.maxOpenings) {
        touched.add('openings');
        const slot = select('[data-error-for="openings"]', form);
        setText(slot, message('CALC_008'));
        if (slot) slot.hidden = false;
        return;
      }
      const row = addOpeningRow(null, system);
      updateLabels(system);
      select<HTMLElement>('[data-opening-field="width"]', row ?? form)?.focus();
      touched.add('openings');
      readAndApply();
    } else if (target.closest('[data-remove-opening]')) {
      target.closest('[data-opening-row]')?.remove();
      touched.add('openings');
      readAndApply();
    } else if (target.closest('[data-add-room]')) {
      loadRoom(null, null, true);
      refresh();
      fieldEl('length')?.focus();
    } else if (target.closest('[data-cancel-edit]')) {
      loadRoom(null, null, true);
      refresh();
    }
  }

  function onRoomListClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>('[data-room-item]');
    const id = item?.getAttribute('data-room-id') ?? null;
    if (target.closest('[data-clear-data]')) {
      if (!window.confirm('Remove every saved room from this browser?')) return;
      store.clearMyData();
      loadRoom(null, null, true);
      track('data_cleared');
      refresh();
      return;
    }
    if (!id) return;
    if (target.closest('[data-edit-room]')) {
      const room = store.getState().rooms.find((r) => r.id === id);
      if (!room) return;
      loadRoom(stripRoom(room), room.id, false);
      refresh();
      fieldEl('name')?.focus();
    } else if (target.closest('[data-remove-room]')) {
      store.removeRoom(id);
      if (editingId === id) loadRoom(null, null, true);
      refresh();
    }
  }

  function onResultsInput(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.hasAttribute('data-price-input')) return;
    const key = input.getAttribute('data-price-input') ?? '';
    if (!PRICE_KEYS.includes(key)) return;
    const card = input.closest('[data-material-card]');
    const errorEl = select('[data-price-error]', card ?? input);
    const showError = (text: string): void => {
      setText(errorEl, text);
      if (errorEl) errorEl.hidden = text === '';
    };
    const settings = store.getState().settings;
    const prices = { ...settings.prices };
    const text = input.value.trim();
    if (text === '') {
      delete prices[key as PriceKey];
    } else {
      const typed = parseDecimal(text);
      if (typed === null) return showError(message('CALC_007'));
      const stored = typed / priceUnit(key as MaterialKey, settings.unitSystem).factor;
      if (typed < LIMITS.priceMin || stored > LIMITS.priceMax) return showError(message('CALC_006'));
      prices[key as PriceKey] = stored;
    }
    showError('');
    store.setSettings({ prices });
  }

  function onAddToProject(): void {
    if (!transient) return;
    try {
      store.addRoom(transient);
    } catch (error) {
      if (error instanceof CalcValidationError) {
        setText(statusEl, message(error.code, error.params));
        return;
      }
      throw error;
    }
    const link = select<HTMLElement>('[data-add-to-project]', root);
    const href = link?.getAttribute('href') ?? '/';
    store.flush();
    window.location.assign(href);
  }

  /* --- start --- */

  function readPreset(): RoomInput | null {
    const raw = form?.dataset.preset;
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return null;
      const { settings, rooms } = store.getState();
      const merged: RoomInput = { ...createDefaultRoomInput(settings, rooms.length), ...(parsed as Partial<RoomInput>) };
      validateRoom({ ...merged, id: 'preset', createdAt: STAMP, updatedAt: STAMP });
      return merged;
    } catch {
      return null; // A bad preset falls back to an empty form.
    }
  }

  const unsubscribe = store.subscribe(refresh);
  form.addEventListener('input', onFormEvent);
  form.addEventListener('change', onFormEvent);
  form.addEventListener('submit', onSubmit);
  form.addEventListener('click', onFormClick);
  roomListEl?.addEventListener('click', onRoomListClick);
  resultsEl?.addEventListener('input', onResultsInput);
  const addToProject = select('[data-add-to-project]', root);
  const onAddClick = (event: Event): void => {
    event.preventDefault();
    onAddToProject();
  };
  addToProject?.addEventListener('click', onAddClick);
  const onPageHide = (): void => store.flush();
  window.addEventListener('pagehide', onPageHide);

  const initial = store.getState();
  if (mode === 'project' && initial.rooms[0]) {
    loadRoom(stripRoom(initial.rooms[0]), initial.rooms[0].id, false);
  } else {
    const preset = mode === 'single' ? readPreset() : null;
    loadRoom(preset, null, preset === null);
    if (preset) transient = preset;
  }
  refresh();

  return () => {
    unsubscribe();
    form.removeEventListener('input', onFormEvent);
    form.removeEventListener('change', onFormEvent);
    form.removeEventListener('submit', onSubmit);
    form.removeEventListener('click', onFormClick);
    roomListEl?.removeEventListener('click', onRoomListClick);
    resultsEl?.removeEventListener('input', onResultsInput);
    addToProject?.removeEventListener('click', onAddClick);
    window.removeEventListener('pagehide', onPageHide);
  };
}
