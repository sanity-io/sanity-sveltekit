<script lang="ts">
  import config from '$lib/sanity/sanity.config';
  import { SanityStudio } from '@sanity/sveltekit';
  import {
    PUBLIC_SANITY_PROJECT_ID as projectId,
    PUBLIC_SANITY_DATASET as dataset
  } from '$env/static/public';
</script>

<SanityStudio config={{ ...config, projectId, dataset }} />
