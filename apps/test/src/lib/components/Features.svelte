<script lang="ts">
  import { getEnvironment, getIsPreviewing, getPerspective, getLoader } from '@sanity/sveltekit';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  const loader = getLoader();
  const environment = getEnvironment();
  const perspective = getPerspective();
  const isPreviewing = getIsPreviewing();
</script>

<footer
  class="fixed bottom-0 left-[50%] text-center mb-3 text-xs -translate-x-6/12 rounded overflow-hidden whitespace-nowrap"
>
  <div class="flex bg-white/80 text-black backdrop-blur-sm">
    {#if isPreviewing}
      <a
        class="relative flex transition-all duration-300 p-2 gap-1 group hover:bg-red-100 hover:text-red-500"
        href={resolve(`/preview/disable`, {
          redirect: page.url.pathname
        })}
      >
        <div class="opacity-50">Preview</div>
        <div class="overflow-hidden">
          <div class="transition-transform duration-300 group-hover:-translate-y-full relative">
            <div class="h-full absolute top-full tracking-tight">disable?</div>
            <div class="h-full">enabled</div>
          </div>
        </div>
      </a>
    {:else}
      <div class="relative flex transition-all duration-300 p-2 gap-1">
        <div class="opacity-50">Preview</div>
        <div>disabled</div>
      </div>
    {/if}
    <div class="relative flex transition-all duration-300 p-2 gap-1">
      <div class="cursor-pointer opacity-50">Loader</div>
      <div>
        {loader?.value || 'none'}
      </div>
    </div>
    {#if environment?.value}
      <div class="relative flex transition-all duration-300 p-2 gap-1">
        <div class="cursor-pointer opacity-50">Environment</div>
        <div>
          {environment?.value}
        </div>
      </div>
    {/if}
    {#if perspective?.value}
      <div class="relative flex transition-all duration-300 p-2 gap-1">
        <div class="cursor-pointer opacity-50">Perspective</div>
        <div>
          {perspective.value}
        </div>
      </div>
    {/if}
  </div>
</footer>
