<script lang="ts">
  import config from '$lib/sanity/sanity.config';
  import { SanityStudio } from '@sanity/sveltekit/studio';
</script>

<SanityStudio {config} />
