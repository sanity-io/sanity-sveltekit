<!--
  @component
  Renders an image from the Sanity Image CDN with a responsive `srcset`.

  Pass the whole image value from a query: the Studio crop is applied, the
  crop is positioned around the hotspot when the aspect ratio changes, and
  `placeholder="blur"` uses `asset->metadata.lqip`. `width` and `height` are
  inferred when omitted.
-->
<script lang="ts">
  import { resolveImage, type ImageProps } from './getImageProps';

  let {
    ref = $bindable(),
    onload,
    ...props
  }: ImageProps & { ref?: HTMLImageElement | undefined } = $props();

  const resolved = $derived(resolveImage(props));
  let loadedSrc = $state<string>();
  const style = $derived(
    resolved.placeholderStyle && loadedSrc !== resolved.attributes.src
      ? `${resolved.attributes.style};${resolved.placeholderStyle}`
      : resolved.attributes.style
  );

  // The image can finish loading before hydration attaches the load listener
  $effect(() => {
    if (ref?.complete && ref.naturalWidth > 0) loadedSrc = resolved.attributes.src;
  });
</script>

<svelte:head>
  {#if resolved.preload}
    <link
      rel="preload"
      as="image"
      href={resolved.preload.href}
      imagesrcset={resolved.preload.imagesrcset}
      imagesizes={resolved.preload.imagesizes}
      fetchpriority={resolved.preload.fetchpriority}
    />
  {/if}
</svelte:head>

<img
  bind:this={ref}
  {...resolved.attributes}
  {style}
  onload={(event) => {
    loadedSrc = resolved.attributes.src;
    onload?.(event);
  }}
/>
