export const EVENT_TYPE_WEIGHT: Record<string, number> = {
  CONTRACT: 1.8,
  EARNINGS: 1.2,
  DISCLOSURE: 1.0,
  GUIDANCE: 1.15,
  PRODUCT: 1.1,
  PARTNERSHIP: 1.25,
  DEFAULT: 0.9,
};

export const SOURCE_TYPE_WEIGHT: Record<string, number> = {
  DART: 1.2,
  NEWS: 1.0,
  BASIC_INFO: 0.6,
  DEFAULT: 1.0,
};

export const EVENT_TYPE_BASE_SCORE: Record<string, number> = {
  CONTRACT: 20,
  EARNINGS: 12,
  GUIDANCE: 11,
  PARTNERSHIP: 10,
  PRODUCT: 8,
  DISCLOSURE: 7,
  DEFAULT: 5,
};

export function getFreshnessWeight(days: number): number {
  if (days <= 1) return 1.3;
  if (days <= 3) return 1.15;
  if (days <= 7) return 1.0;
  if (days <= 14) return 0.8;
  if (days <= 30) return 0.5;
  return 0.2;
}