export const STATUSES = ['todo', 'doing', 'done'];
export const PRIORITIES = ['low', 'medium', 'high'];

export function cleanTask(input, { generateId = () => globalThis.crypto.randomUUID(), now = () => new Date().toISOString() } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Task must be an object');
  const title = String(input.title ?? '').trim();
  if (!title || title.length > 100) throw new RangeError('Title must be between 1 and 100 characters');
  const description = String(input.description ?? '').trim();
  if (description.length > 500) throw new RangeError('Description must be 500 characters or less');
  const status = input.status ?? 'todo';
  const priority = input.priority ?? 'medium';
  if (!STATUSES.includes(status)) throw new RangeError('Invalid status');
  if (!PRIORITIES.includes(priority)) throw new RangeError('Invalid priority');
  const id = typeof input.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(input.id) ? input.id : generateId();
  const createdAt = typeof input.createdAt === 'string' && !Number.isNaN(Date.parse(input.createdAt)) ? input.createdAt : now();
  return { id, title, description, status, priority, createdAt };
}

export function addTask(tasks, draft, options) {
  const task = cleanTask(draft, options);
  if (tasks.some(item => item.id === task.id)) throw new Error('Duplicate task ID');
  return [...tasks, task];
}
export function moveTask(tasks, id, status) {
  if (!STATUSES.includes(status)) throw new RangeError('Invalid status');
  return tasks.map(task => task.id === id ? { ...task, status } : task);
}
export function removeTask(tasks, id) { return tasks.filter(task => task.id !== id); }
export function summarize(tasks) {
  return { total: tasks.length, todo: tasks.filter(x => x.status === 'todo').length, doing: tasks.filter(x => x.status === 'doing').length, done: tasks.filter(x => x.status === 'done').length, percent: tasks.length ? Math.round(tasks.filter(x => x.status === 'done').length / tasks.length * 100) : 0 };
}
export function importTasks(json) {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed) || parsed.length > 500) throw new Error('Expected an array of no more than 500 tasks');
  const tasks = parsed.map(x => cleanTask(x));
  if (new Set(tasks.map(x => x.id)).size !== tasks.length) throw new Error('Duplicate task IDs');
  return tasks;
}
