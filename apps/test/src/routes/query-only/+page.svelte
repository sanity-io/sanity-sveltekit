<script lang="ts">
  import { useQuery } from '@sanity/sveltekit/query';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  const query = useQuery(data);
</script>

<ul data-testid="buildings">
  {#each $query.data ?? [] as building (building._id)}
    <li>{building.name}</li>
  {/each}
</ul>
