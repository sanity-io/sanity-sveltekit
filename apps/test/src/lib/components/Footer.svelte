<script lang="ts">
  const { architects }: { architects: string[] } = $props();

  const separator = (index: number) =>
    index === architects.length - 1 ? '.' : index === architects.length - 2 ? ' and ' : ', ';
</script>

<div class="mt-3 mb-12 px-3 text-center text-sm">
  Buildings by
  {#each architects as architect, i (architect)}
    <span>{architect}</span>{separator(i)}
  {/each}
  Built with
  <a href="https://www.sanity.io" class="hover:underline focus:underline">Sanity.io</a> and
  <a href="https://kit.svelte.dev" class="hover:underline focus:underline">Sveltekit</a>.
</div>
