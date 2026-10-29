<script lang="ts">
  import { countOf, type Problem } from '#lib/kb/problems';

  // A count for a sentence: <ProblemCount ticket={4471} problem="hint" />
  let { ticket, problem }: { ticket: number; problem: Problem } = $props();
</script>

<strong>{countOf(ticket, problem)}</strong>
