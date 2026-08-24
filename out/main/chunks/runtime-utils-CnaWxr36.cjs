"use strict";
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(new Error("Cancelled by user"));
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => {
    clearTimeout(timer);
    reject(new Error("Cancelled by user"));
  }, { once: true });
});
function normalizeDelayRange(minValue, maxValue, fallbackMin, fallbackMax) {
  const min = Number.isFinite(Number(minValue)) ? Math.max(0, Math.round(Number(minValue))) : fallbackMin;
  const max = Number.isFinite(Number(maxValue)) ? Math.max(0, Math.round(Number(maxValue))) : fallbackMax;
  return [Math.min(min, max), Math.max(min, max)];
}
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.normalizeDelayRange = normalizeDelayRange;
exports.randomBetween = randomBetween;
exports.sleep = sleep;
