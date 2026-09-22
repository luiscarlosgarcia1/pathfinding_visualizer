export const normalizeGridDimensionInput = (value, maximum) => {
  if (value === "") return "";

  const dimension = Number(value);
  return Number.isFinite(dimension) ? Math.min(dimension, maximum) : value;
};
