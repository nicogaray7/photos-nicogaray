/**
 * Rounds a coordinate to ~1km precision before any public-facing use.
 * Keeps travel-photo context (city/area) without exposing an exact,
 * potentially identifying location (e.g. home address).
 */
export function fuzzPublicCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}
