/**
 * Error catalogue (TDD §G.48). Messages are fixed text with optional {placeholders}.
 * Never put stored data, stack traces or environment values in a message.
 */

export const ERROR_CODES = [
  'CALC_001',
  'CALC_002',
  'CALC_003',
  'CALC_004',
  'CALC_005',
  'CALC_006',
  'CALC_007',
  'CALC_008',
  'STO_001',
  'STO_002',
  'CNS_001',
  'ADS_001',
  'NAV_404',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ErrorDefinition {
  code: ErrorCode;
  /** Text for the visitor. Empty string means the error is silent. */
  userMessage: string;
  /** Text for the console and for developers. */
  developerMessage: string;
}

export const ERRORS: Readonly<Record<ErrorCode, ErrorDefinition>> = {
  CALC_001: {
    code: 'CALC_001',
    userMessage: 'That size looks off. Check it is between {min} and {max}.',
    developerMessage: 'dimension out of range',
  },
  CALC_002: {
    code: 'CALC_002',
    userMessage: 'The doors and windows are bigger than the walls.',
    developerMessage: 'openings area >= wall area',
  },
  CALC_003: {
    code: 'CALC_003',
    userMessage: 'You can add up to 10 rooms.',
    developerMessage: 'room limit reached',
  },
  CALC_004: {
    code: 'CALC_004',
    userMessage: 'Choose 1 to 4 coats.',
    developerMessage: 'coats out of range',
  },
  CALC_005: {
    code: 'CALC_005',
    userMessage: 'Waste can be 0 to 30%.',
    developerMessage: 'waste out of range',
  },
  CALC_006: {
    code: 'CALC_006',
    userMessage: 'Enter a price between 0 and 100,000.',
    developerMessage: 'price out of range',
  },
  CALC_007: {
    code: 'CALC_007',
    userMessage: 'Enter a number.',
    developerMessage: 'empty or NaN',
  },
  CALC_008: {
    code: 'CALC_008',
    userMessage: 'You can add up to 20 doors and windows.',
    developerMessage: 'openings count > 20',
  },
  STO_001: {
    code: 'STO_001',
    userMessage: "We can't save in this browser, so your rooms will be lost when you leave.",
    developerMessage: 'localStorage unavailable',
  },
  STO_002: {
    code: 'STO_002',
    userMessage: 'We reset your saved rooms because they could not be read.',
    developerMessage: 'stored data invalid or unknown version',
  },
  CNS_001: {
    code: 'CNS_001',
    userMessage: '',
    developerMessage: 'consent library failed',
  },
  ADS_001: {
    code: 'ADS_001',
    userMessage: '',
    developerMessage: 'ad script failed or blocked',
  },
  NAV_404: {
    code: 'NAV_404',
    userMessage: "We couldn't find that page.",
    developerMessage: 'unknown route',
  },
};

export type MessageParams = Readonly<Record<string, string | number>>;

/** Fill {placeholders} in a message. Unknown placeholders are left as they are. */
export function formatMessage(template: string, params: MessageParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Shape shown next to a field (TDD §G.50). */
export interface ValidationErrorShape {
  code: ErrorCode;
  field: string;
  message: string;
}

export class CalcValidationError extends Error {
  readonly code: ErrorCode;
  readonly field: string;
  readonly params: MessageParams;

  constructor(code: ErrorCode, field: string, params: MessageParams = {}) {
    super(formatMessage(ERRORS[code].userMessage, params));
    this.name = 'CalcValidationError';
    this.code = code;
    this.field = field;
    this.params = params;
  }

  toShape(): ValidationErrorShape {
    return { code: this.code, field: this.field, message: this.message };
  }
}

/** One-line console text: the code and the field name only (TDD §G.51). */
export function describeForLog(code: ErrorCode, field?: string): string {
  const base = `${code}: ${ERRORS[code].developerMessage}`;
  return field ? `${base} [${field}]` : base;
}
