// The problems a merged ticket holds, one ticket each. causes.ts places a report by its tenant; a
// report whose words show something else (desk-notes.json) is its own problem here, not a footnote.
import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

// `one-day`: the date moved by a day, day and month in place. No tenant or form explains that, so
// it comes from what the desk read in the report, never from the tenant.
export type Problem = Cause | 'one-day' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

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

export type Split = { rows: number; reports: Report[]; groups: ProblemGroup[] };

const tally = (rs: Report[], key: (r: Report) => string) =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const rows = all.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(rows);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of unique) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
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
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: rows.length, reports: unique, groups };
}

// The desk's export and notes, split. Pages call this; it runs on every build.
export const splitOf = (ticket: number): Split =>
  splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove);

export const countOf = (ticket: number, problem: Problem): number =>
  splitOf(ticket).groups.find((g) => g.problem === problem)?.reports.length ?? 0;
