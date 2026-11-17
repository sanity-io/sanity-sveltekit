import { stegaClean } from '@sanity/client/stega';
import type { CropMode, FitMode, ImageUrlBuilder } from '@sanity/image-url';
import type { HTMLImgAttributes } from 'svelte/elements';
import { imageLoader } from './imageLoader';
import { resolveImageDimensions, type Dimension } from './resolveImageDimensions';
import { imageBuilderFor, isSanityAssetId, lqipFrom, type ImageSource } from './resolveImageSource';
import { hotspotObjectPosition } from './resolveObjectPosition';

type QueryParams = Record<string, string | number>;

export interface ImageProps extends Omit<
  HTMLImgAttributes,
  'src' | 'srcset' | 'width' | 'height' | 'sizes' | 'alt' | 'loading' | 'style' | 'placeholder'
> {
  /**
   * The image to render. Either:
   * - a URL to an image on the Sanity Image CDN, e.g. from `asset->url` or an
   *   `@sanity/image-url` builder,
   * - an image object from a GROQ query (`{asset, crop, hotspot}`), applying
   *   the crop and hotspot set in the Studio,
   * - an asset reference (`{_ref}`), an asset document (`{_id, url}`),
   * - or a Sanity image asset id (`image-…`).
   *
   * Objects and asset ids need `projectId` and `dataset` to build the URL,
   * unless the asset URL is part of the object (e.g. `asset->{url}`).
   * Stega-encoded metadata from Content Source Maps is stripped automatically.
   */
  src: ImageSource;
  alt: string;
  /**
   * The Sanity project the image belongs to, used (together with `dataset`)
   * to build the URL when `src` is an image object or asset id. Falls back to
   * the project encoded in the asset URL when the query dereferences it.
   */
  projectId?: string;
  /** The Sanity dataset the image belongs to, see `projectId`. */
  dataset?: string;
  /**
   * The rendered width in pixels. Optional: inferred from the URL's `w`/`h`
   * params, the Studio crop, or the dimensions Sanity encodes in the asset
   * filename. Given only one of `width`/`height`, the other follows the
   * image's aspect ratio.
   */
  width?: Dimension;
  /** The rendered height in pixels, see `width`. */
  height?: Dimension;
  /**
   * Stretch the image over its positioned parent instead of rendering at a
   * fixed size. Combine with `object-fit: cover` (e.g. `class="object-cover"`).
   * `object-position` defaults to the hotspot.
   */
  fill?: boolean;
  /**
   * The `sizes` attribute. With `sizes` the srcset uses width descriptors,
   * without it 1x/2x density descriptors. Defaults to `100vw` with `fill`.
   */
  sizes?: string;
  /** The `q` param, 1-100. Omitted by default, deferring to the CDN default. */
  quality?: Dimension;
  /**
   * Additional [Sanity Image CDN params](https://www.sanity.io/docs/image-urls)
   * merged into the image URL, e.g. `{blur: 50, sat: -100}`. Sizing params
   * (`w`, `h`, `rect`) are ignored: they come from `width`/`height`, the URL
   * and the image object's crop and hotspot.
   *
   * For image objects and asset ids, `fit`, the crop mode (`crop`) and a focal
   * point (`fp-x` and `fp-y` together) are forwarded to the image URL builder
   * before it computes the crop and hotspot.
   */
  queryParams?: QueryParams;
  /**
   * `blur` shows a blurred `asset->metadata.lqip` (or `blurDataURL`) until the
   * image loads, and renders no placeholder when neither is available. A
   * `data:image/…` URL is used as the placeholder as-is.
   */
  placeholder?: 'blur' | 'empty' | `data:image/${string}`;
  /** Overrides the lqip read from the image object for `placeholder="blur"`. */
  blurDataURL?: string;
  /**
   * Preload the image with a `<link rel="preload">` in `<svelte:head>`, and
   * stop lazy loading it. Use for the largest image above the fold.
   */
  preload?: boolean;
  /** Defaults to `lazy`, unless `preload` is set. */
  loading?: 'lazy' | 'eager';
  style?: string;
}

/** Attributes for an `<img>` element. */
export interface ImageAttributes extends Omit<HTMLImgAttributes, 'style' | 'width' | 'height'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  style: string;
}

export interface ImagePreload {
  href: string;
  imagesrcset: string | undefined;
  imagesizes: string | undefined;
  fetchpriority: HTMLImgAttributes['fetchpriority'];
}

interface ResolvedImage {
  attributes: ImageAttributes;
  /** Removed once the image has loaded */
  placeholderStyle: string | undefined;
  preload: ImagePreload | undefined;
}

/**
 * The defaults of `next/image`, so the CDN cache is shared with other frameworks
 * that resolve the same widths.
 */
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const ALL_SIZES = [32, 48, 64, 96, 128, 256, 384, ...DEVICE_SIZES];

const FILL_STYLE = 'position:absolute;height:100%;width:100%;inset:0';

const SIZING_PARAMS = new Set(['w', 'h', 'rect']);

/**
 * Every fit and crop mode `@sanity/image-url` accepts. A new mode in that
 * library fails typechecking here until it is listed.
 */
const FIT_MODES: Record<FitMode, true> = {
  clip: true,
  crop: true,
  fill: true,
  fillmax: true,
  max: true,
  scale: true,
  min: true
};

const CROP_MODES: Record<CropMode, true> = {
  top: true,
  bottom: true,
  left: true,
  right: true,
  center: true,
  focalpoint: true,
  entropy: true
};

/**
 * Resolves the `<img>` attributes the `Image` component renders, without
 * rendering it. Use it for art direction with `<picture>`:
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { getImageProps } from '@sanity/sveltekit/image';
 *   const common = { src: image, alt: '', sizes: '100vw' };
 *   const { props: desktop } = getImageProps({ ...common, width: 1440, height: 640 });
 *   const { props: mobile } = getImageProps({ ...common, width: 750, height: 1000 });
 * </script>
 *
 * <picture>
 *   <source media="(min-width: 1000px)" srcset={desktop.srcset} />
 *   <img {...mobile} />
 * </picture>
 * ```
 */
export function getImageProps(props: ImageProps): { props: ImageAttributes } {
  const { attributes, placeholderStyle } = resolveImage(props);
  return {
    props: placeholderStyle
      ? { ...attributes, style: `${attributes.style};${placeholderStyle}` }
      : attributes
  };
}

export function resolveImage(props: ImageProps): ResolvedImage {
  const {
    src,
    projectId,
    dataset,
    width: propWidth,
    height: propHeight,
    fill,
    sizes: propSizes,
    quality,
    queryParams,
    placeholder = 'empty',
    blurDataURL,
    preload,
    loading,
    decoding = 'async',
    fetchpriority,
    style,
    ...rest
  } = props;

  const source = typeof src === 'string' ? stegaClean(src) : src;
  const explicitPosition = cssValue(style, 'object-position');
  const hotspotPosition =
    fill && !explicitPosition
      ? hotspotObjectPosition(source, queryParams?.['flip'], queryParams?.['or'])
      : undefined;

  const sizes = propSizes ?? (fill ? '100vw' : undefined);
  const image = resolveSources(source, {
    projectId,
    dataset,
    propWidth,
    propHeight,
    fill,
    sizes,
    quality,
    queryParams
  });

  const srcsetSizes = image.srcset ? sizes : undefined;
  const isLazy = !preload && (loading === 'lazy' || loading === undefined);
  const attributes: ImageAttributes = {
    ...rest,
    alt: props.alt,
    loading: isLazy ? 'lazy' : loading,
    width: image.width,
    height: image.height,
    decoding,
    fetchpriority,
    style: joinStyles(
      fill ? FILL_STYLE : undefined,
      'color:transparent',
      hotspotPosition && `object-position:${hotspotPosition}`,
      style
    ),
    sizes: srcsetSizes,
    srcset: image.srcset,
    src: image.src
  };

  return {
    attributes,
    placeholderStyle: placeholderStyleFor({
      placeholder,
      blurDataURL: blurDataURL ?? lqipFrom(src),
      width: image.width,
      height: image.height,
      objectFit: cssValue(style, 'object-fit'),
      objectPosition: explicitPosition ?? hotspotPosition
    }),
    preload: preload
      ? {
          href: image.src,
          imagesrcset: image.srcset,
          imagesizes: srcsetSizes,
          fetchpriority
        }
      : undefined
  };
}

interface SourceOptions {
  projectId: string | undefined;
  dataset: string | undefined;
  propWidth: Dimension | undefined;
  propHeight: Dimension | undefined;
  fill: boolean | undefined;
  sizes: string | undefined;
  quality: Dimension | undefined;
  queryParams: QueryParams | undefined;
}

interface ResolvedSources {
  src: string;
  srcset: string | undefined;
  width: number | undefined;
  height: number | undefined;
}

function resolveSources(source: ImageSource, options: SourceOptions): ResolvedSources {
  const { projectId, dataset, propWidth, propHeight, fill, sizes, quality, queryParams } = options;

  // data: and blob: URLs can't point to the Sanity Image CDN and don't support
  // transformation params: pass them through untouched.
  if (typeof source === 'string' && (source.startsWith('data:') || source.startsWith('blob:'))) {
    const { width, height } = resolveImageDimensions(new URL(source), propWidth, propHeight, true);
    return { src: source, srcset: undefined, width, height };
  }

  let builder: ImageUrlBuilder | undefined;
  let forwardedParams: ReadonlySet<string> = new Set();
  let srcUrl: URL;
  if (typeof source === 'string' && !isSanityAssetId(source)) {
    try {
      srcUrl = new URL(source);
    } catch (err) {
      throw new TypeError('The `src` must be a valid URL to an image on the Sanity Image CDN.', {
        cause: err
      });
    }
  } else {
    const built = withBuilderQueryParams(
      imageBuilderFor(source, { projectId, dataset }),
      queryParams
    );
    builder = built.builder;
    forwardedParams = built.forwarded;
    srcUrl = new URL(builder.url());
  }
  applyQueryParams(srcUrl, queryParams, forwardedParams);

  const { width, height } = resolveImageDimensions(srcUrl, propWidth, propHeight, fill);

  // Rebuild built URLs with the resolved dimensions, so the crop region is
  // positioned around the hotspot when the aspect ratio changes.
  if (builder && width && height) {
    srcUrl = new URL(builder.width(width).height(height).url());
    applyQueryParams(srcUrl, queryParams, forwardedParams);
  }

  // Encoding the resolved dimensions as CDN params lets the loader scale
  // both axes proportionally for every srcset candidate.
  if (height) srcUrl.searchParams.set('h', `${height}`);
  if (width) srcUrl.searchParams.set('w', `${width}`);

  const base = srcUrl.toString();
  const { widths, kind } = candidateWidths(width, sizes);
  const srcset = widths
    .map(
      (w, i) =>
        `${imageLoader({ src: base, width: w, quality })} ${kind === 'w' ? w : i + 1}${kind}`
    )
    .join(', ');
  return {
    // The largest candidate, for browsers without srcset support
    src: imageLoader({ src: base, width: widths[widths.length - 1]!, quality }),
    srcset,
    width,
    height
  };
}

/**
 * With `sizes`, width descriptors for every configured size that can be
 * needed (dropping those below the smallest `vw` fraction of the smallest
 * device). Without, 1x and 2x density descriptors snapped to configured sizes.
 */
function candidateWidths(
  width: number | undefined,
  sizes: string | undefined
): { widths: number[]; kind: 'w' | 'x' } {
  if (sizes) {
    const viewportWidth = /(^|\s)(1?\d?\d)vw/g;
    const percentSizes: number[] = [];
    for (let match; (match = viewportWidth.exec(sizes)); ) {
      percentSizes.push(parseInt(match[2]!, 10));
    }
    if (percentSizes.length) {
      const smallestRatio = Math.min(...percentSizes) * 0.01;
      return {
        widths: ALL_SIZES.filter((size) => size >= DEVICE_SIZES[0]! * smallestRatio),
        kind: 'w'
      };
    }
    return { widths: ALL_SIZES, kind: 'w' };
  }
  if (width === undefined) {
    return { widths: DEVICE_SIZES, kind: 'w' };
  }
  const widths = [
    ...new Set(
      [width, width * 2].map(
        (w) => ALL_SIZES.find((size) => size >= w) ?? ALL_SIZES[ALL_SIZES.length - 1]!
      )
    )
  ];
  return { widths, kind: 'x' };
}

/**
 * Params that change the rect `@sanity/image-url` emits, rather than CDN
 * effects applied afterwards. They have to be set on the builder before
 * `url()`: appending them later leaves the crop and hotspot computed as if
 * they were unset.
 */
function withBuilderQueryParams(
  builder: ImageUrlBuilder,
  queryParams: QueryParams | undefined
): { builder: ImageUrlBuilder; forwarded: ReadonlySet<string> } {
  const forwarded = new Set<string>();
  if (!queryParams) return { builder, forwarded };

  let next = builder;
  const fit = queryParams['fit'];
  if (fit !== undefined) {
    next = next.fit(readBuilderMode(FIT_MODES, fit, 'fit'));
    forwarded.add('fit');
  }
  const crop = queryParams['crop'];
  if (crop !== undefined) {
    next = next.crop(readBuilderMode(CROP_MODES, crop, 'crop'));
    forwarded.add('crop');
  }

  const focalX = queryParams['fp-x'];
  const focalY = queryParams['fp-y'];
  if (focalX !== undefined && focalY !== undefined) {
    const x = Number(focalX);
    const y = Number(focalY);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      next = next.focalPoint(x, y);
      forwarded.add('fp-x');
      forwarded.add('fp-y');
    }
  }

  return { builder: next, forwarded };
}

function readBuilderMode<Mode extends string>(
  modes: Record<Mode, true>,
  value: string | number,
  param: 'fit' | 'crop'
): Mode {
  const mode = `${value}`;
  if (Object.hasOwn(modes, mode)) return mode as Mode;
  throw new TypeError(
    `Invalid \`queryParams.${param}\` value "${mode}". Expected one of: ${Object.keys(modes).join(', ')}.`
  );
}

function applyQueryParams(
  url: URL,
  queryParams: QueryParams | undefined,
  forwarded: ReadonlySet<string>
): void {
  if (!queryParams) return;
  for (const [key, value] of Object.entries(queryParams)) {
    if (SIZING_PARAMS.has(key) || forwarded.has(key)) continue;
    url.searchParams.set(key, `${value}`);
  }
}

interface PlaceholderOptions {
  placeholder: NonNullable<ImageProps['placeholder']>;
  blurDataURL: string | undefined;
  width: number | undefined;
  height: number | undefined;
  objectFit: string | undefined;
  objectPosition: string | undefined;
}

function placeholderStyleFor(options: PlaceholderOptions): string | undefined {
  const { placeholder, blurDataURL, width, height, objectFit, objectPosition } = options;
  let backgroundImage: string | undefined;
  if (placeholder === 'blur') {
    if (!blurDataURL) return undefined;
    backgroundImage = `url("data:image/svg+xml;charset=utf-8,${blurSvg(blurDataURL, width, height, objectFit)}")`;
  } else if (placeholder.startsWith('data:image/')) {
    backgroundImage = `url("${placeholder}")`;
  } else {
    return undefined;
  }
  return joinStyles(
    `background-size:${objectFit ?? 'cover'}`,
    `background-position:${objectPosition ?? '50% 50%'}`,
    'background-repeat:no-repeat',
    `background-image:${backgroundImage}`
  );
}

/**
 * The blurred SVG `next/image` renders for `placeholder="blur"`: the tiny lqip
 * scaled up behind a Gaussian blur, with its edges kept opaque.
 */
function blurSvg(
  blurDataURL: string,
  width: number | undefined,
  height: number | undefined,
  objectFit: string | undefined
): string {
  const std = 20;
  const viewBox = width && height ? `viewBox='0 0 ${width} ${height}'` : '';
  const preserveAspectRatio = viewBox
    ? 'none'
    : objectFit === 'contain'
      ? 'xMidYMid'
      : objectFit === 'cover'
        ? 'xMidYMid slice'
        : 'none';
  return `%3Csvg xmlns='http://www.w3.org/2000/svg' ${viewBox}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='${std}'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='${std}'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${preserveAspectRatio}' style='filter: url(%23b);' href='${blurDataURL}'/%3E%3C/svg%3E`;
}

/** Reads a declaration from an inline style string. */
function cssValue(style: string | undefined, property: string): string | undefined {
  if (!style) return undefined;
  const match = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i').exec(style);
  return match?.[1]?.trim() || undefined;
}

function joinStyles(...declarations: Array<string | false | undefined>): string {
  return declarations
    .map((declaration) => (declaration ? declaration.trim().replace(/;+$/, '') : ''))
    .filter(Boolean)
    .join(';');
}
