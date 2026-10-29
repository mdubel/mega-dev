<script lang="ts">
  import { splitOf, type Problem } from '#lib/kb/problems';

  // `tickets`: where each problem is filed, problem → issue URL.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitOf(ticket));
  const repeated = $derived(split.rows - split.reports.length);
  // Reports counted under one-day as well as where they are filed: filed problem → count.
  const twice = $derived(
    split.readAs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.filed]: (n[r.filed] ?? 0) + 1 }), {}),
  );
  const tally = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
  const issue = (url: string) => `#${url.split('/').pop()}`;
</script>

<p class="sum">
  <strong>{split.reports.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>
{#if repeated}
  <p class="note">The export lists {split.rows} rows: {repeated} of them repeat a report id and count once.</p>
{/if}

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const url = tickets[g.problem]}
      <tr class:open={!url}>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td class="tags">{tally(g.channels)}</td>
        <td class="tags">{tally(g.taggedAs)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if url}<a href={url}>{issue(url)}</a>{:else}no ticket yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each Object.entries(twice) as [filed, n] (filed)}
  <p class="note">{n} reports count twice: filed under <code>{filed}</code> by tenant, and under <code>one-day</code> by what they say.</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
</style>
