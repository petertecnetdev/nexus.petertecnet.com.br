export function money(v) {
  const n = parseFloat(v || 0);
  return n.toFixed(2).replace(".", ",");
}
