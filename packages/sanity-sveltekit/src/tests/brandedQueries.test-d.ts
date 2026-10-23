import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Readable } from 'svelte/store';
import { describe, expectTypeOf, test } from 'vitest';
import { loadQuery, sanityFetch, useQuery, type SanityLocals } from '$lib';

type Post = { _id: string; title: string | null };
type PostParams = { slug: string };

// The shape `@sanity-labs/groq-content-mapper` gives the default export of a `.groq` file
declare const postQuery: '*[_type == "post" && slug.current == $slug][0]' & {
  readonly __groqResult?: Post;
  readonly __groqParams?: PostParams;
};
declare const postsQuery: '*[_type == "post"]' & {
  readonly __groqResult?: Post[];
  readonly __groqParams?: Record<string, never>;
};
// Branded, and its text is also registered in `SanityQueries` below
declare const registeredPostQuery: '*[_type == "post"][0]' & {
  readonly __groqResult?: Post;
  readonly __groqParams?: Record<string, never>;
};

declare module '@sanity/client' {
  interface SanityQueries {
    '*[_type == "post"][0]': { registered: true };
  }
}

// The brand written out by hand, with required properties
declare const handBranded: string & { __groqResult: Post; __groqParams: PostParams };

declare const event: ServerLoadEvent;
declare const locals: SanityLocals;

declare function storeValue<Value>(store: Readable<Value>): Value;

describe('sanityFetch', () => {
  test('infers the result and checks the params', async () => {
    const { data } = await sanityFetch(event, { query: postQuery, params: { slug: 'hello' } });
    expectTypeOf(data).toEqualTypeOf<Post>();

    const handBrandedResult = await sanityFetch(event, {
      query: handBranded,
      params: Promise.resolve({ slug: 'hello' })
    });
    expectTypeOf(handBrandedResult.data).toEqualTypeOf<Post>();

    const viaLocals = await locals.sanity.fetch(event, { query: postQuery, params: { slug: 'a' } });
    expectTypeOf(viaLocals.data).toEqualTypeOf<Post>();
  });

  test('rejects wrong params', async () => {
    // @ts-expect-error -- `slug` must be a string
    await sanityFetch(event, { query: postQuery, params: { slug: 1 } });
    // @ts-expect-error -- `slug` is missing
    await sanityFetch(event, { query: handBranded, params: { other: 'hello' } });
  });

  test('requires the required params', async () => {
    // @ts-expect-error -- `params` is required
    await sanityFetch(event, { query: postQuery });
    // @ts-expect-error -- `params` is required
    await locals.sanity.fetch(event, { query: handBranded });
  });

  test('a query without params needs none', async () => {
    const { data } = await sanityFetch(event, { query: postsQuery });
    expectTypeOf(data).toEqualTypeOf<Post[]>();
  });
});

describe('loadQuery', () => {
  test('infers the result and checks the params', async () => {
    const { data } = await loadQuery(postQuery, { slug: 'hello' }, { tag: 'post' });
    expectTypeOf(data).toEqualTypeOf<Post>();

    const viaLocals = await locals.sanity.loadQuery(handBranded, { slug: 'hello' });
    expectTypeOf(viaLocals.data).toEqualTypeOf<Post>();
  });

  test('rejects wrong params', async () => {
    // @ts-expect-error -- `slug` must be a string
    await loadQuery(postQuery, { slug: 1 });
    // @ts-expect-error -- `slug` is missing
    await locals.sanity.loadQuery(handBranded, { other: 'hello' });
  });

  test('requires the required params', async () => {
    // @ts-expect-error -- `params` is required
    await loadQuery(postQuery);
    // @ts-expect-error -- `params` is required
    await locals.sanity.loadQuery(handBranded);
  });

  test('a query without params needs none', async () => {
    expectTypeOf((await loadQuery(postsQuery)).data).toEqualTypeOf<Post[]>();
  });

  test('the brand wins over a SanityQueries registration of the same text', async () => {
    expectTypeOf((await loadQuery(registeredPostQuery)).data).toEqualTypeOf<Post>();
    expectTypeOf(
      (await sanityFetch(event, { query: registeredPostQuery })).data
    ).toEqualTypeOf<Post>();
    expectTypeOf(storeValue(useQuery(registeredPostQuery)).data).toEqualTypeOf<Post | undefined>();
  });

  test('an explicit generic still wins', async () => {
    const { data } = await loadQuery<{ custom: true }>(postQuery, { slug: 'hello' });
    expectTypeOf(data).toEqualTypeOf<{ custom: true }>();
  });
});

describe('useQuery', () => {
  test('infers the data and checks the params', () => {
    const store = useQuery(postQuery, { slug: 'hello' });
    expectTypeOf(storeValue(store).data).toEqualTypeOf<Post | undefined>();

    const objectForm = useQuery({ query: handBranded, params: { slug: 'hello' } });
    expectTypeOf(storeValue(objectForm).data).toEqualTypeOf<Post | undefined>();
  });

  test('infers the data alongside an initial value from loadQuery', async () => {
    const initial = await loadQuery(postQuery, { slug: 'hello' });
    const store = useQuery(postQuery, { slug: 'hello' }, { initial });
    expectTypeOf(storeValue(store).data).toEqualTypeOf<Post | undefined>();
  });

  test('rejects wrong params', () => {
    // @ts-expect-error -- `slug` must be a string
    useQuery(postQuery, { slug: 1 });
    // @ts-expect-error -- `slug` is missing
    useQuery({ query: handBranded, params: { other: 'hello' } });
  });

  test('requires the required params', () => {
    // @ts-expect-error -- `params` is required
    useQuery(postQuery);
    // @ts-expect-error -- `params` is required
    useQuery({ query: handBranded });
  });

  test('a query without params needs none', () => {
    const store = useQuery(postsQuery);
    expectTypeOf(storeValue(store).data).toEqualTypeOf<Post[] | undefined>();
  });
});
