import { stegaClean } from '@sanity/client/stega';

export interface ImageLoaderParams {
  /** A Sanity Image CDN URL, usually with `w`/`h` params for the display size */
  src: string;
  /** The width of the srcset candidate */
  width: number;
  quality?: number | `${number}`;
}

/**
 * Builds the Sanity Image CDN URL for one srcset candidate. When the URL has
 * both `w` and `h`, the height is scaled to keep that aspect ratio at the
 * candidate width. `auto=format` is always set, and `fit` defaults to `min`
 * when there is a height (fill the box, never upscale past it) and `max`
 * otherwise.
 */
export function imageLoader({ src, width, quality }: ImageLoaderParams): string {
  const url = new URL(stegaClean(src));
  url.searchParams.set('auto', 'format');
  if (!url.searchParams.has('fit')) {
    url.searchParams.set('fit', url.searchParams.has('h') ? 'min' : 'max');
  }
  if (url.searchParams.has('h') && url.searchParams.has('w')) {
    const originalHeight = parseInt(url.searchParams.get('h')!, 10);
    const originalWidth = parseInt(url.searchParams.get('w')!, 10);
    url.searchParams.set('h', Math.round((originalHeight / originalWidth) * width).toString());
  }
  url.searchParams.set('w', width.toString());
  if (quality) {
    url.searchParams.set('q', quality.toString());
  }
  return url.href;
}
