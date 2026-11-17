import type { StegaBranded } from '@sanity/client/stega';
import { describe, expectTypeOf, test } from 'vitest';
import {
  isImageWithAsset,
  type ImageProps,
  type InferImageValue,
  type InferStrictImageValue
} from '$lib/image';

type QueryResult = {
  title: string | null;
  cover: {
    asset: { url: string | null; metadata: { lqip: string | null } | null } | null;
    crop: { top: number; bottom: number; left: number; right: number } | null;
    hotspot: { x: number; y: number; width: number; height: number } | null;
  } | null;
};

describe('InferImageValue', () => {
  test('collects the image shapes of a query result, also when stega-branded', () => {
    type ImageValue = InferImageValue<QueryResult>;
    expectTypeOf<NonNullable<QueryResult['cover']>>().toExtend<ImageValue>();
    expectTypeOf<NonNullable<StegaBranded<QueryResult>['cover']>>().toExtend<ImageValue>();
  });

  test('the inferred values are accepted as src', () => {
    expectTypeOf<InferImageValue<QueryResult>>().toExtend<ImageProps['src']>();
  });

  test('isImageWithAsset narrows to the strict variant', () => {
    const image = {} as InferImageValue<QueryResult> | null;
    if (isImageWithAsset(image)) {
      expectTypeOf(image).toExtend<InferStrictImageValue<QueryResult>>();
    }
  });
});
