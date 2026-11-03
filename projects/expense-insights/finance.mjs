export const CATEGORIES = ['Food', 'Transport', 'School', 'Housing', 'Entertainment', 'Other'];
export function parseMoney(value) {
  if (typeof value === 'boolean' || value == null || String(value).trim() === '') throw new TypeError('Amount required');
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > 1_000_000 || !/^\d+(?:\.\d{1,2})?$/.test(String(value).trim())) throw new RangeError('Use a positive amount with at most two decimal places');
  return Math.round(num * 100);
}
export function normalizeTransaction(input, {makeId = () => crypto.randomUUID()} = {}) {
  if (!input || typeof input !== 'object') throw new TypeError('Transaction must be an object');
  const merchant = String(input.merchant ?? '').trim();
  if (!merchant || merchant.length > 80) throw new RangeError('Description must be 1–80 characters');
  if (!CATEGORIES.includes(input.category)) throw new RangeError('Invalid category');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || new Date(`${input.date}T00:00:00Z`).toISOString().slice(0,10) !== input.date) throw new RangeError('Invalid date');
  return { id: typeof input.id === 'string' ? input.id : makeId(), merchant, category: input.category, date: input.date, cents: Number.isSafeInteger(input.cents) && input.cents > 0 ? input.cents : parseMoney(input.amount) };
}
export function totalsForMonth(transactions, month) {
  const matching = transactions.filter(t => t.date.slice(0, 7) === month);
  const byCategory = Object.fromEntries(CATEGORIES.map(name => [name, 0]));
  for (const item of matching) byCategory[item.category] += item.cents;
  const total = Object.values(byCategory).reduce((sum,value) => sum + value, 0);
  return { total, count: matching.length, byCategory, matching: matching.slice().sort((a,b)=> b.date.localeCompare(a.date)) };
}
export function dollars(cents) { return (cents / 100).toLocaleString('en-US', {style:'currency',currency:'USD'}); }
export function toCSV(transactions) {
 const escape = value => {
   const text = String(value);
   const safe = /^[\s]*[=+@-]/.test(text) ? `''${text}` : text;
   return `"${safe.replaceAll('\"','\"\"')}"`;
 };
 return ['date,description,category,amount', ...transactions.map(t=>[t.date,t.merchant,t.category,(t.cents/100).toFixed(2)].map(escape).join(','))].join('\n');
}
