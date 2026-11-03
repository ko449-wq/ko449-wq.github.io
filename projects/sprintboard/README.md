# SprintBoard — task workflow lab

A responsive Kanban-style task board built with **vanilla JavaScript, HTML, and CSS**. [Live demo](https://ko449-wq.github.io/projects/sprintboard/).

## What it demonstrates
- A testable, dependency-free `model.mjs` separated from browser UI code.
- Task validation, state transitions, priority filtering, and progress calculations.
- Browser `localStorage` persistence with defensive import handling.
- JSON import/export and keyboard-accessible form controls.
- DOM rendering through `textContent` rather than user-controlled HTML injection.

## Run and test

```bash
python3 -m http.server 8000
# open http://localhost:8000/projects/sprintboard/
node --test projects/sprintboard/tests/*.test.mjs
```

The board starts with clearly labeled **sample tasks**. All edits stay inside the browser; there is no server or user account. Reset replaces local data. This is an independent portfolio sample, not a production collaboration tool.
