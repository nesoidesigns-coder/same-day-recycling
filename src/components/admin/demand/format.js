// Named value exports for sibling panels — keeps shared money/fmt formatting
// out of duplicated code.
export const money = (v) => `$${Math.round(Number(v) || 0).toLocaleString("en-CA")}`;
export const fmt = (v) => Number(v || 0).toLocaleString("en-CA");