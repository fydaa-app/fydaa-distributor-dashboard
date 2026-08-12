export function calculateProjectedCorpus({
  sipAmount,
  frequency,
  tenure,
  expectedCagr,
}: {
  sipAmount: number;
  frequency: "daily" | "monthly";
  tenure: number;
  expectedCagr: number;
}): number {
  const periodsPerYear = frequency === "daily" ? 264 : 12;
  const n = periodsPerYear * tenure;
  const r = Math.pow(1 + expectedCagr, 1 / periodsPerYear) - 1;

  if (r === 0) return sipAmount * n;

  const corpus = sipAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return corpus;
}
