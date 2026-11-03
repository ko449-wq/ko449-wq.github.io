# Kolawole Ogunniyi — Software Engineering Portfolio

Personal portfolio and independently runnable engineering samples built with HTML, CSS, JavaScript, Python, SQLite, and automated tests.

**Live site:** https://ko449-wq.github.io/

## Featured projects

- [SprintBoard](https://ko449-wq.github.io/projects/sprintboard/) — browser-based task tracking, workflow state, validation, and JSON import/export.
- [Expense Insights](https://ko449-wq.github.io/projects/expense-insights/) — expense dashboard, category calculations, and CSV export using browser-local data.
- [IssueDesk API](projects/issue-desk-api/) — Python REST API with SQLite, input validation, and integration tests.
- [Cub Critics](https://github.com/ko449-wq/Cub-Critics) — campus dining review application, group project.
- [SkillSpring](https://github.com/Tornikeigrok/COSC484-skillspring) — group web application; frontend development contribution.

## Test the labs

```sh
node --test projects/sprintboard/tests/*.test.mjs projects/expense-insights/tests/*.test.mjs
(cd projects/issue-desk-api && python3 -m unittest discover -s tests -v)
```

The two browser applications use browser-local storage, and their initial transactions/tasks are example records. The Python backend requires a local server and is not deployed to static GitHub Pages. See the individual `projects/` folders for setup details.
