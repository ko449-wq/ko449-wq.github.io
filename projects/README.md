# Engineering portfolio labs

Three original, independently runnable software samples by Kolawole Ogunniyi, written to demonstrate skills in **UI engineering, data handling, Python/SQL, API design, validation, and automated testing**. These are educational portfolio projects, not production services or prior employer deliverables.

| Project | Stack | Try it | Source |
| --- | --- | --- | --- |
| SprintBoard | HTML, CSS, modern JavaScript, Node tests | [Live board](https://ko449-wq.github.io/projects/sprintboard/) | [Files](sprintboard/) |
| Expense Insights | HTML, CSS, JavaScript, localStorage, CSV | [Live dashboard](https://ko449-wq.github.io/projects/expense-insights/) | [Files](expense-insights/) |
| IssueDesk API | Python, SQLite, JSON REST, unittest | Local API | [Files](issue-desk-api/) |

## Run tests

From the repository root:

```sh
node --test projects/sprintboard/tests/*.test.mjs projects/expense-insights/tests/*.test.mjs
(cd projects/issue-desk-api && python3 -m unittest discover -s tests -v)
```

GitHub Actions runs these checks on changes under `projects/`. The browser demos run on static GitHub Pages with no external APIs; data is saved locally in the visitor's browser. All initial sample records are explicitly demonstration data.
