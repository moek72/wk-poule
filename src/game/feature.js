export const FEATURE_COST = 4;

export function canStartFeature(club) {
  return club >= FEATURE_COST;
}
