import type { QueryParams } from '@sanity/client';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Readable } from 'svelte/store';
import { describe, expectTypeOf, test } from 'vitest';
import { defineQuery, loadQuery, sanityFetch, useQuery, type SanityLocals } from '$lib';
import type { LoadQuery, QueryResponseInitial } from '$lib/types';

type Building = { _id: string; name: string };
type Registered = { _id: string; registered: true };

declare module '@sanity/client' {
  interface SanityQueries {
    '*[_type == "registered"][0]': Registered;
  }
}

declare const event: ServerLoadEvent;
declare const locals: SanityLocals;
declare const plainQuery: string;
declare const queryOrObject:
  | string
  | { query: string; params?: QueryParams; options?: { initial?: QueryResponseInitial<Building> } };

declare function storeValue<Value>(store: Readable<Value>): Value;

const definedQuery = defineQuery('*[_type == "building"]');
const registeredQuery = defineQuery('*[_type == "registered"][0]');

describe('sanityFetch', () => {
  test('a plain string resolves to any', async () => {
    const { data } = await sanityFetch(event, { query: plainQuery });
    expectTypeOf(data).toBeAny();
  });

  test('an unregistered defineQuery resolves to any', async () => {
    const { data } = await sanityFetch(event, { query: definedQuery, params: { slug: 'a' } });
    expectTypeOf(data).toBeAny();
  });

  test('a SanityQueries registration resolves to the registered type', async () => {
    const { data } = await sanityFetch(event, { query: registeredQuery });
    expectTypeOf(data).toEqualTypeOf<Registered>();
  });

  test('params stay optional, and accept any QueryParams or a promise of them', async () => {
    await sanityFetch(event, { query: plainQuery, params: { anything: 1 } });
    await sanityFetch(event, { query: plainQuery, params: Promise.resolve({ anything: 1 }) });
    await sanityFetch(event, { query: definedQuery });
  });

  test('locals.sanity.fetch has the same shape', async () => {
    const { data } = await locals.sanity.fetch(event, { query: registeredQuery });
    expectTypeOf(data).toEqualTypeOf<Registered>();
  });
});

describe('loadQuery', () => {
  test('without a generic the result is unknown', async () => {
    const { data } = await loadQuery(plainQuery);
    expectTypeOf(data).toBeUnknown();
  });

  test('an explicit generic sets the result', async () => {
    const { data } = await loadQuery<Building[]>(definedQuery, { slug: 'a' }, { tag: 'tag' });
    expectTypeOf(data).toEqualTypeOf<Building[]>();
  });

  test('a SanityQueries registration does not change the result', async () => {
    expectTypeOf((await loadQuery(registeredQuery)).data).toBeUnknown();
    expectTypeOf((await loadQuery<Building>(registeredQuery)).data).toEqualTypeOf<Building>();
  });

  test('locals.sanity.loadQuery has the same shape', async () => {
    const { data } = await locals.sanity.loadQuery<Building>(plainQuery, { anything: 1 });
    expectTypeOf(data).toEqualTypeOf<Building>();
  });

  test('a custom implementation written against the original signature still assigns', () => {
    const custom: LoadQuery = async <QueryResponseResult>(
      query: string,
      params?: QueryParams,
      options?: { tag?: string }
    ): Promise<QueryResponseInitial<QueryResponseResult>> => {
      void [query, params, options];
      return { data: undefined as QueryResponseResult, sourceMap: undefined };
    };
    expectTypeOf(custom).toBeFunction();
  });
});

describe('useQuery', () => {
  test('without a generic the data is unknown', () => {
    const store = useQuery(plainQuery, { anything: 1 });
    expectTypeOf(storeValue(store).data).toBeUnknown();
  });

  test('an explicit generic sets the data', () => {
    const store = useQuery<Building, Error>(definedQuery);
    expectTypeOf(storeValue(store).data).toEqualTypeOf<Building | undefined>();
    expectTypeOf(storeValue(store).error).toEqualTypeOf<Error | undefined>();
  });

  test('the data is inferred from options.initial', async () => {
    const initial = await loadQuery<Building>(definedQuery);
    const store = useQuery(definedQuery, {}, { initial });
    expectTypeOf(storeValue(store).data).toEqualTypeOf<Building | undefined>();
  });

  test('the object form infers the data from options.initial', async () => {
    const initial = await loadQuery<Building>(registeredQuery);
    const store = useQuery({ query: registeredQuery, params: { slug: 'a' }, options: { initial } });
    expectTypeOf(storeValue(store).data).toEqualTypeOf<Building | undefined>();
  });

  test('a string-or-object union is still accepted', () => {
    const store = useQuery(queryOrObject);
    expectTypeOf(storeValue(store).data).toEqualTypeOf<Building | undefined>();
  });
});
