# mega-dev

Work for the MEGA.dev course Challenges.

## S01E03 · what it shows

`support-kb/` is the support desk's kb export, with one page added:

- the page: [`support-kb/src/routes/kb/incidents/4471/split/+page.svx`](support-kb/src/routes/kb/incidents/4471/split/+page.svx)
- the page as the desk sees it, rendered: [`support-kb/rendered/kb/incidents/4471/split.html`](support-kb/rendered/kb/incidents/4471/split.html)
- its logic: `support-kb/src/lib/kb/problems.ts`, `ProblemTable.svelte`, `ProblemCount.svelte`

The tickets are this repo's issues: #1 `parser`, #2 `hint`, #3 `one-day`.

Build the kb: `cd support-kb && npm ci && npm run build` (output in `support-kb/build/`).
