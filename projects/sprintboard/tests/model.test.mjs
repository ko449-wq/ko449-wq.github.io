import test from 'node:test';
import assert from 'node:assert/strict';
import { addTask, moveTask, removeTask, summarize, importTasks } from '../model.mjs';
const options = {generateId: () => 'one', now: () => '2026-01-01T00:00:00Z'};
test('adds a validated task with defaults', () => {
 const [item] = addTask([], {title:'  Write tests  '}, options);
 assert.equal(item.title, 'Write tests'); assert.equal(item.status, 'todo'); assert.equal(item.id, 'one');
});
test('rejects invalid task data', () => {
 assert.throws(() => addTask([], {title:''}, options));
 assert.throws(() => addTask([], {title:'A', priority:'urgent'}, options));
 assert.throws(() => addTask([{id:'one'}], {title:'A'}, options), /Duplicate/);
});
test('moves and removes without mutating source', () => {
 const original = addTask([], {title:'Test'}, options);
 const moved = moveTask(original, 'one', 'done');
 assert.equal(original[0].status, 'todo'); assert.equal(moved[0].status, 'done');
 assert.equal(removeTask(moved, 'one').length, 0);
});
test('calculates completion with empty-board guard', () => {
 assert.equal(summarize([]).percent, 0);
 assert.equal(summarize([{status:'done'},{status:'todo'}]).percent, 50);
});
test('validates imported JSON and duplicate identifiers', () => {
 assert.equal(importTasks('[{"id":"a","title":"Demo"}]').length, 1);
 assert.throws(() => importTasks('{"title":"Not an array"}'));
 assert.throws(() => importTasks('[{"id":"a","title":"A"},{"id":"a","title":"B"}]'));
});
