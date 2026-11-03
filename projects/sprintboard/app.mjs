import { STATUSES, addTask, removeTask, moveTask, summarize, importTasks } from './model.mjs';
const STORAGE_KEY = 'ko-sprintboard-v1';
const DEMO = [
  { id: 'demo-1', title: 'Design task detail screen', description: 'Review accessibility and mobile breakpoints.', status: 'todo', priority: 'high', createdAt: '2026-10-14T09:00:00Z' },
  { id: 'demo-2', title: 'Write API contract checks', description: 'Cover success responses and validation errors.', status: 'doing', priority: 'medium', createdAt: '2026-10-15T12:00:00Z' },
  { id: 'demo-3', title: 'Set up project structure', description: 'Split UI state from reusable task logic.', status: 'done', priority: 'low', createdAt: '2026-10-12T08:00:00Z' }
];
const $ = selector => document.querySelector(selector);
const board = $('#board');
const form = $('#task-form');
const message = $('#message');
let tasks;
try { tasks = localStorage.getItem(STORAGE_KEY) ? importTasks(localStorage.getItem(STORAGE_KEY)) : DEMO; }
catch { tasks = DEMO; }
let filter = 'all';
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  catch { showMessage('Could not save locally. Check browser storage settings.', true); }
}
function showMessage(text, error = false) {
  message.textContent = text;
  message.dataset.kind = error ? 'error' : 'success';
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function taskCard(task) {
  const article = el('article', 'task-card');
  article.setAttribute('aria-label', `${task.title}, ${task.priority} priority`);
  const meta = el('div', 'task-meta');
  meta.append(el('span', `priority ${task.priority}`, `${task.priority.toUpperCase()} PRIORITY`), el('time', '', new Date(task.createdAt).toLocaleDateString()));
  const heading = el('h3', '', task.title);
  const description = el('p', 'task-description', task.description || 'No description');
  const footer = el('div', 'task-actions');
  const select = el('select');
  select.setAttribute('aria-label', `Move ${task.title} to`);
  for (const status of STATUSES) {
    const option = el('option', '', status === 'todo' ? 'To do' : status === 'doing' ? 'In progress' : 'Done');
    option.value = status; option.selected = task.status === status; select.append(option);
  }
  select.addEventListener('change', () => { tasks = moveTask(tasks, task.id, select.value); persist(); render(); });
  const remove = el('button', 'danger-button', 'Remove');
  remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${task.title}`);
  remove.addEventListener('click', () => { tasks = removeTask(tasks, task.id); persist(); render(); showMessage('Task removed.'); });
  footer.append(select, remove);
  article.append(meta, heading, description, footer);
  return article;
}
function render() {
  const metrics = summarize(tasks);
  $('#total').textContent = String(metrics.total);
  $('#completed').textContent = `${metrics.percent}%`;
  $('#progress-bar').style.width = `${metrics.percent}%`;
  $('#progress-bar').setAttribute('aria-valuenow', metrics.percent);
  board.replaceChildren();
  for (const status of STATUSES) {
    const column = el('section', 'column');
    const columnItems = tasks.filter(item => item.status === status && (filter === 'all' || item.priority === filter));
    const heading = el('div', 'column-heading');
    heading.append(el('h2', '', ({todo:'To do',doing:'In progress',done:'Done'})[status]), el('span', 'count', String(columnItems.length)));
    column.append(heading);
    const items = el('div', 'task-list');
    if (!columnItems.length) items.append(el('p', 'empty', 'No tasks here yet.'));
    for (const task of columnItems) items.append(taskCard(task));
    column.append(items); board.append(column);
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  try { tasks = addTask(tasks, data); persist(); form.reset(); render(); showMessage('Task created successfully.'); $('#title').focus(); }
  catch (error) { showMessage(error.message, true); }
});
$('#priority-filter').addEventListener('change', event => { filter = event.target.value; render(); });
$('#export-button').addEventListener('click', () => {
  const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' }));
  const anchor = el('a'); anchor.href = objectUrl; anchor.download = 'sprintboard-tasks.json'; anchor.click(); URL.revokeObjectURL(objectUrl);
  showMessage('Exported current tasks as JSON.');
});
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try { tasks = importTasks(await file.text()); persist(); render(); showMessage(`Imported ${tasks.length} tasks.`); }
  catch (error) { showMessage(`Import failed: ${error.message}`, true); }
  finally { event.target.value = ''; }
});
$('#reset-button').addEventListener('click', () => {
  if (!window.confirm('Reset all tasks to sample data? This replaces your saved board.')) return;
  tasks = structuredClone(DEMO); persist(); render(); showMessage('Reset to sample data.');
});
render();
