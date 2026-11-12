import { describe, expect, it } from 'vitest';
import { CalcValidationError } from '../../src/lib/calc/errors';
import type { ErrorCode } from '../../src/lib/calc/errors';
import {
  isValidRoomName,
  sanitizeProject,
  validateOpenings,
  validatePaintOptions,
  validatePrice,
  validateRoom,
  validateRoomInput,
  validateSettings,
  validateWaste,
} from '../../src/lib/calc/validation';
import {
  makeInvalidRoom,
  makeOpening,
  makeProject,
  makeRoom,
  makeRoomWithOpenings,
  makeSettings,
} from '../helpers/roomFixtures';
import type { InvalidRoomKind } from '../helpers/roomFixtures';

function codeOf(fn: () => void): ErrorCode | null {
  try {
    fn();
    return null;
  } catch (error) {
    if (error instanceof CalcValidationError) return error.code;
    throw error;
  }
}

describe('validateRoomInput', () => {
  it('accepts the minimum and maximum length', () => {
    expect(codeOf(() => validateRoomInput(makeRoom({ lengthM: 0.5 })))).toBeNull();
    expect(codeOf(() => validateRoomInput(makeRoom({ lengthM: 100 })))).toBeNull();
  });
  it('rejects a length just outside the limits with CALC_001', () => {
    expect(codeOf(() => validateRoomInput(makeInvalidRoom('lengthTooSmall')))).toBe('CALC_001');
    expect(codeOf(() => validateRoomInput(makeInvalidRoom('lengthTooLarge')))).toBe('CALC_001');
  });
  it('checks width the same way as length', () => {
    expect(codeOf(() => validateRoomInput(makeRoom({ widthM: 0.5 })))).toBeNull();
    expect(codeOf(() => validateRoomInput(makeRoom({ widthM: 100.01 })))).toBe('CALC_001');
  });
  it('accepts the height limits 1.5 and 6', () => {
    expect(codeOf(() => validateRoomInput(makeRoom({ heightM: 1.5 })))).toBeNull();
    expect(codeOf(() => validateRoomInput(makeRoom({ heightM: 6 })))).toBeNull();
  });
  it('rejects a height just outside the limits', () => {
    expect(codeOf(() => validateRoomInput(makeInvalidRoom('heightTooLow')))).toBe('CALC_001');
    expect(codeOf(() => validateRoomInput(makeInvalidRoom('heightTooHigh')))).toBe('CALC_001');
  });
  it('rejects NaN and empty values with CALC_007', () => {
    expect(codeOf(() => validateRoomInput(makeInvalidRoom('widthNaN')))).toBe('CALC_007');
    expect(codeOf(() => validateRoomInput(makeInvalidRoom('widthEmpty')))).toBe('CALC_007');
    expect(codeOf(() => validateRoomInput(makeRoom({ lengthM: Infinity })))).toBe('CALC_007');
  });
  it('names the failing field and fills in the limits', () => {
    try {
      validateRoomInput(makeRoom({ lengthM: 0.4 }));
      expect.unreachable();
    } catch (error) {
      const e = error as CalcValidationError;
      expect(e.field).toBe('lengthM');
      expect(e.message).toBe('That size looks off. Check it is between 0.5 m and 100 m.');
      expect(e.toShape()).toEqual({ code: 'CALC_001', field: 'lengthM', message: e.message });
    }
  });
});

describe('validateOpenings', () => {
  it('accepts a room with no openings and a normal door and window', () => {
    expect(codeOf(() => validateOpenings(makeRoom()))).toBeNull();
    expect(codeOf(() => validateOpenings(makeRoomWithOpenings()))).toBeNull();
  });
  it('accepts exactly 20 openings and rejects 21 with CALC_008', () => {
    const rows = (n: number) =>
      Array.from({ length: n }, (_, i) => makeOpening({ id: `o${i}`, widthM: 0.2, heightM: 0.2 }));
    expect(codeOf(() => validateOpenings(makeRoom({ openings: rows(20) })))).toBeNull();
    expect(codeOf(() => validateOpenings(makeInvalidRoom('tooManyOpenings')))).toBe('CALC_008');
  });
  it('rejects openings as big as the walls with CALC_002', () => {
    expect(codeOf(() => validateOpenings(makeInvalidRoom('openingsTooBig')))).toBe('CALC_002');
  });
  it('accepts openings that leave a sliver of wall', () => {
    // 36 m2 of wall; 29.9 + 5.9 = 35.8 m2 of openings leaves 0.2 m2.
    const room = makeRoom({
      openings: [
        makeOpening({ id: 'x', widthM: 5, heightM: 2.99, count: 2 }),
        makeOpening({ id: 'y', widthM: 5, heightM: 1.18, count: 1 }),
      ],
    });
    expect(codeOf(() => validateOpenings(room))).toBeNull();
  });
  it('rejects an opening size outside its limits', () => {
    const wide = makeRoom({ openings: [makeOpening({ widthM: 5.1 })] });
    const tiny = makeRoom({ openings: [makeOpening({ heightM: 0.19 })] });
    expect(codeOf(() => validateOpenings(wide))).toBe('CALC_001');
    expect(codeOf(() => validateOpenings(tiny))).toBe('CALC_001');
  });
  it('rejects a bad count, a bad kind and a missing list', () => {
    expect(codeOf(() => validateOpenings(makeRoom({ openings: [makeOpening({ count: 0 })] })))).toBe(
      'CALC_001',
    );
    expect(codeOf(() => validateOpenings(makeRoom({ openings: [makeOpening({ count: 1.5 })] })))).toBe(
      'CALC_001',
    );
    expect(codeOf(() => validateOpenings(makeRoom({ openings: [makeOpening({ count: 11 })] })))).toBe(
      'CALC_001',
    );
    const badKind = makeRoom({ openings: [makeOpening({ kind: 'gate' as 'door' })] });
    expect(codeOf(() => validateOpenings(badKind))).toBe('CALC_001');
    const notAList = makeRoom({ openings: 'none' as unknown as [] });
    expect(codeOf(() => validateOpenings(notAList))).toBe('CALC_007');
  });
});

describe('validatePaintOptions', () => {
  const base = makeRoom().paint;
  it('accepts 1 to 4 coats', () => {
    for (const coats of [1, 2, 3, 4]) {
      expect(codeOf(() => validatePaintOptions({ ...base, coats }))).toBeNull();
    }
  });
  it('rejects 0, 5 and fractional coats with CALC_004', () => {
    expect(codeOf(() => validatePaintOptions(makeInvalidRoom('coatsZero').paint))).toBe('CALC_004');
    expect(codeOf(() => validatePaintOptions(makeInvalidRoom('coatsFive').paint))).toBe('CALC_004');
    expect(codeOf(() => validatePaintOptions({ ...base, coats: 2.5 }))).toBe('CALC_004');
  });
  it('rejects NaN coats with CALC_007', () => {
    expect(codeOf(() => validatePaintOptions({ ...base, coats: Number.NaN }))).toBe('CALC_007');
  });
  it('rejects bad coverage, spare and pack sizes', () => {
    expect(codeOf(() => validatePaintOptions({ ...base, coverageM2PerL: 0 }))).toBe('CALC_001');
    expect(codeOf(() => validatePaintOptions({ ...base, wasteSparePct: 31 }))).toBe('CALC_005');
    expect(codeOf(() => validatePaintOptions({ ...base, packSizesL: [] }))).toBe('CALC_001');
    expect(codeOf(() => validatePaintOptions({ ...base, packSizesL: [0] }))).toBe('CALC_001');
  });
});

describe('validateWaste', () => {
  it('accepts 0 and 30', () => {
    expect(codeOf(() => validateWaste(0))).toBeNull();
    expect(codeOf(() => validateWaste(30))).toBeNull();
  });
  it('rejects -0.1 and 30.1 with CALC_005', () => {
    expect(codeOf(() => validateWaste(-0.1))).toBe('CALC_005');
    expect(codeOf(() => validateWaste(30.1))).toBe('CALC_005');
  });
  it('rejects NaN and empty with CALC_007', () => {
    expect(codeOf(() => validateWaste(Number.NaN))).toBe('CALC_007');
    expect(codeOf(() => validateWaste(''))).toBe('CALC_007');
  });
});

describe('validatePrice', () => {
  it('accepts 0 and 100000', () => {
    expect(codeOf(() => validatePrice(0))).toBeNull();
    expect(codeOf(() => validatePrice(100_000))).toBeNull();
  });
  it('rejects -1 and 100000.01 with CALC_006', () => {
    expect(codeOf(() => validatePrice(-1))).toBe('CALC_006');
    expect(codeOf(() => validatePrice(100_000.01))).toBe('CALC_006');
  });
  it('rejects NaN and a missing value with CALC_007', () => {
    expect(codeOf(() => validatePrice(Number.NaN))).toBe('CALC_007');
    expect(codeOf(() => validatePrice(undefined))).toBe('CALC_007');
  });
});

describe('validateRoom', () => {
  it('accepts a normal room', () => {
    expect(codeOf(() => validateRoom(makeRoomWithOpenings()))).toBeNull();
  });
  it.each<[InvalidRoomKind, ErrorCode]>([
    ['lengthTooSmall', 'CALC_001'],
    ['widthNaN', 'CALC_007'],
    ['openingsTooBig', 'CALC_002'],
    ['tooManyOpenings', 'CALC_008'],
    ['coatsZero', 'CALC_004'],
    ['wasteNegative', 'CALC_005'],
    ['wasteTooHigh', 'CALC_005'],
  ])('rejects the %s variant with %s', (kind, code) => {
    expect(codeOf(() => validateRoom(makeInvalidRoom(kind)))).toBe(code);
  });
  it('rejects an empty or very long name', () => {
    expect(codeOf(() => validateRoom(makeRoom({ name: '' })))).toBe('CALC_007');
    expect(codeOf(() => validateRoom(makeRoom({ name: 'x'.repeat(41) })))).toBe('CALC_007');
    expect(codeOf(() => validateRoom(makeRoom({ name: 'x'.repeat(40) })))).toBeNull();
  });
  it('checks flooring, tile and wallpaper options', () => {
    const base = makeRoom();
    const grout = makeRoom({ tile: { ...base.tile, groutM: 0.021 } });
    const repeat = makeRoom({ wallpaper: { ...base.wallpaper, repeatM: 0.91 } });
    const box = makeRoom({ flooring: { ...base.flooring, boxCoverageM2: 0 } });
    const pattern = makeRoom({ tile: { ...base.tile, layPattern: 'zigzag' as 'straight' } });
    expect(codeOf(() => validateRoom(grout))).toBe('CALC_001');
    expect(codeOf(() => validateRoom(repeat))).toBe('CALC_001');
    expect(codeOf(() => validateRoom(box))).toBe('CALC_001');
    expect(codeOf(() => validateRoom(pattern))).toBe('CALC_001');
  });
});

describe('isValidRoomName', () => {
  it('accepts 1 to 40 characters only', () => {
    expect(isValidRoomName('A')).toBe(true);
    expect(isValidRoomName('')).toBe(false);
    expect(isValidRoomName('x'.repeat(41))).toBe(false);
    expect(isValidRoomName(42)).toBe(false);
  });
});

describe('validateSettings', () => {
  it('accepts the default settings', () => {
    expect(codeOf(() => validateSettings(makeSettings()))).toBeNull();
  });
  it('rejects a bad region, unit system, price or override', () => {
    expect(codeOf(() => validateSettings(makeSettings({ region: 'FR' as 'US' })))).toBe('CALC_001');
    expect(codeOf(() => validateSettings(makeSettings({ unitSystem: 'x' as 'metric' })))).toBe('CALC_001');
    expect(codeOf(() => validateSettings(makeSettings({ prices: { paint: -1 } })))).toBe('CALC_006');
    expect(codeOf(() => validateSettings(makeSettings({ overrides: { 'paint.coverage': 0 } })))).toBe('CALC_001');
  });
});

describe('sanitizeProject', () => {
  it('returns a clean copy of a valid project', () => {
    const project = makeProject([makeRoomWithOpenings()]);
    const clean = sanitizeProject(JSON.parse(JSON.stringify(project)));
    expect(clean).toEqual(project);
  });
  it('drops unknown fields (over-posting)', () => {
    const raw = JSON.parse(JSON.stringify(makeProject())) as Record<string, unknown>;
    raw.admin = true;
    (raw.rooms as Record<string, unknown>[])[0]!.evil = '<script>';
    const clean = sanitizeProject(raw);
    expect(clean).not.toBeNull();
    expect(clean).not.toHaveProperty('admin');
    expect(clean!.rooms[0]).not.toHaveProperty('evil');
  });
  it('returns null for anything that is not a valid project', () => {
    expect(sanitizeProject(null)).toBeNull();
    expect(sanitizeProject('text')).toBeNull();
    expect(sanitizeProject([])).toBeNull();
    expect(sanitizeProject({})).toBeNull();
    expect(sanitizeProject({ ...makeProject(), schemaVersion: 2 })).toBeNull();
    expect(sanitizeProject({ ...makeProject(), rooms: 'x' })).toBeNull();
    expect(sanitizeProject({ ...makeProject(), createdAt: 'not a date' })).toBeNull();
  });
  it('returns null for a room with a bad number, a long name or a missing block', () => {
    expect(sanitizeProject(makeProject([makeRoom({ lengthM: -5 })]))).toBeNull();
    expect(sanitizeProject(makeProject([makeRoom({ name: 'x'.repeat(5000) })]))).toBeNull();
    const noPaint = JSON.parse(JSON.stringify(makeProject())) as { rooms: Record<string, unknown>[] };
    delete noPaint.rooms[0]!.paint;
    expect(sanitizeProject(noPaint)).toBeNull();
  });
  it('returns null for more than 10 rooms and for duplicate room ids', () => {
    const many = Array.from({ length: 11 }, (_, i) => makeRoom({ id: `r${i}` }));
    expect(sanitizeProject(makeProject(many))).toBeNull();
    expect(sanitizeProject(makeProject([makeRoom({ id: 'same' }), makeRoom({ id: 'same' })]))).toBeNull();
  });
  it('accepts exactly 10 rooms', () => {
    const ten = Array.from({ length: 10 }, (_, i) => makeRoom({ id: `r${i}` }));
    expect(sanitizeProject(makeProject(ten))?.rooms).toHaveLength(10);
  });
  it('returns null for duplicate opening ids inside a room', () => {
    const room = makeRoom({ openings: [makeOpening({ id: 'a' }), makeOpening({ id: 'a' })] });
    expect(sanitizeProject(makeProject([room]))).toBeNull();
  });
});
