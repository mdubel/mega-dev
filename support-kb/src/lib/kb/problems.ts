// The problems a merged ticket holds, one ticket each. Counted the desk's way: a report counts where
// it is filed, by tenant (causes.ts). A report the desk read as something else (desk-notes.json)
// stays counted there, and is counted again under the problem it shows, which has its own ticket.
import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

// `one-day`: the date moved by a day, day and month in place. No tenant or form explains that, so
// it comes from what the desk read in the report, never from the tenant.
export type Problem = Cause | 'one-day' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

// `readAs`: reports counted under a second problem, each with the problem it is filed under.
export type Split = { rows: number; reports: Report[]; groups: ProblemGroup[]; readAs: { id: string; filed: Problem }[] };

const tally = (rs: Report[], key: (r: Report) => string) =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

function group(problem: Problem, rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    taggedAs: tally(rs, (r) => r.meta.intakeTag),
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: tally(rs, (r) => r.channel),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const rows = all.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(rows);
  const filedAs = (r: Report): Problem => causeOf(r, tenantOf(r)) ?? 'unplaced';
  const filed = new Map<Problem, Report[]>();
  for (const r of unique) filed.set(filedAs(r), [...(filed.get(filedAs(r)) ?? []), r]);
  const moved = unique.filter((r) => oneDayMove.includes(r.id));
  const groups = [...filed.entries(), ...(moved.length ? [['one-day', moved] as const] : [])]
    .map(([problem, rs]) => group(problem, rs))
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: rows.length, reports: unique, groups, readAs: moved.map((r) => ({ id: r.id, filed: filedAs(r) })) };
}

// The desk's export and notes, split. Pages call this; it runs on every build.
export const splitOf = (ticket: number): Split =>
  splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove);

export const countOf = (ticket: number, problem: Problem): number =>
  splitOf(ticket).groups.find((g) => g.problem === problem)?.reports.length ?? 0;
