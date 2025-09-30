<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<div
  class="px-3 mt-3 flex flex-col justify-center items-center h-full flex-grow gap-3 font-medium text-3xl"
>
  <div class="flex gap-6">
    <a href={resolve('/basic')} class="focus:underline hover:underline">Basic</a>
    <a href={resolve('/query-loader')} class="focus:underline hover:underline">Query Loaders</a>
    <a href={resolve('/live-loader')} class="focus:underline hover:underline">Live Content API</a>
  </div>
</div>
