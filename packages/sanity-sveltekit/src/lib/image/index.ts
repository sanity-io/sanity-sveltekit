export { default as Image } from './Image.svelte';
export { getImageProps, type ImageAttributes, type ImageProps } from './getImageProps';
export { imageLoader, type ImageLoaderParams } from './imageLoader';
export type { ImageSource, SanityImageObject } from './resolveImageSource';
export { isImageWithAsset } from '@sanity/image-url';
export type {
  SanityImageAssetLike,
  SanityImageLike,
  SanityImageSource,
  SanityImageWithAsset
} from '@sanity/image-url';
export type { InferImageValue, InferStrictImageValue } from './infer';
