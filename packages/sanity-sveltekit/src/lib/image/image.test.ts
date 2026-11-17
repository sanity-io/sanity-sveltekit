import { vercelStegaCombine } from '@vercel/stega';
import { createImageUrlBuilder } from '@sanity/image-url';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import { getImageProps, Image, imageLoader, isImageWithAsset, type ImageProps } from './index';

const projectId = 'abc123';
const dataset = 'production';
const project = { projectId, dataset };
const cdn = `https://cdn.sanity.io/images/${projectId}/${dataset}`;
const assetRef = (name: string, dims = '2000x1000') => `image-${name}-${dims}-jpg`;

function props(options: ImageProps) {
  return getImageProps(options).props;
}

function paramsOf(url: string): Record<string, string> {
  return Object.fromEntries(new URL(url).searchParams);
}

function candidates(srcset: string | null | undefined) {
  return (srcset ?? '').split(', ').map((candidate) => {
    const [url, descriptor] = candidate.split(' ');
    return { url: url!, descriptor: descriptor!, params: paramsOf(url!) };
  });
}

describe('URLs', () => {
  test('renders a responsive img with 1x/2x candidates and lazy loading', () => {
    const src = `${cdn}/basic-2000x1000.jpg`;
    expect(props({ src, width: 800, height: 400, alt: '' })).toEqual({
      alt: '',
      loading: 'lazy',
      width: 800,
      height: 400,
      decoding: 'async',
      fetchpriority: undefined,
      style: 'color:transparent',
      sizes: undefined,
      srcset: `${src}?h=414&w=828&auto=format&fit=min 1x, ${src}?h=960&w=1920&auto=format&fit=min 2x`,
      src: `${src}?h=960&w=1920&auto=format&fit=min`
    });
  });

  test('infers width and height from the asset filename', () => {
    const result = props({ src: `${cdn}/inferred-1200x1800.jpg`, alt: '' });
    expect([result.width, result.height]).toEqual([1200, 1800]);
  });

  test('derives the missing dimension from the aspect ratio', () => {
    expect(props({ src: `${cdn}/ratio-2000x1000.jpg`, width: 500, alt: '' }).height).toBe(250);
    expect(props({ src: `${cdn}/ratio-2000x1000.jpg`, height: 100, alt: '' }).width).toBe(200);
  });

  test('uses w/h params from an @sanity/image-url builder', () => {
    const src = createImageUrlBuilder(project)
      .image(assetRef('built'))
      .width(300)
      .height(300)
      .url();
    const result = props({ src, alt: '' });
    expect([result.width, result.height]).toEqual([300, 300]);
    expect(paramsOf(result.src).rect).toBe('500,0,1000,1000');
  });

  test('strips stega-encoded metadata from the src', () => {
    const src = vercelStegaCombine(`${cdn}/stega-100x100.jpg`, { origin: 'sanity.io' });
    expect(props({ src, alt: '' }).src).toBe(
      `${cdn}/stega-100x100.jpg?h=256&w=256&auto=format&fit=min`
    );
  });

  test('passes data: URLs through untouched', () => {
    const src = 'data:image/png;base64,iVBORw0KGgo=';
    const result = props({ src, width: 10, height: 10, alt: '' });
    expect(result.src).toBe(src);
    expect(result.srcset).toBeUndefined();
  });

  test('throws for a relative src', () => {
    expect(() => props({ src: '/static/photo.jpg', alt: '' })).toThrow(TypeError);
  });
});

describe('srcset and sizes', () => {
  test('sizes switches to width descriptors from the smallest vw fraction', () => {
    const result = props({
      src: `${cdn}/responsive-2000x1000.jpg`,
      sizes: '(max-width: 768px) 100vw, 50vw',
      alt: ''
    });
    expect(result.sizes).toBe('(max-width: 768px) 100vw, 50vw');
    expect(candidates(result.srcset).map(({ descriptor }) => descriptor)).toEqual([
      '384w',
      '640w',
      '750w',
      '828w',
      '1080w',
      '1200w',
      '1920w',
      '2048w',
      '3840w'
    ]);
    // Every candidate keeps the 2:1 aspect ratio
    expect(candidates(result.srcset).every(({ params }) => +params.w! === 2 * +params.h!)).toBe(
      true
    );
  });

  test('adds the quality to every candidate', () => {
    const result = props({ src: `${cdn}/q-1000x1000.jpg`, width: 100, quality: 60, alt: '' });
    expect(candidates(result.srcset).map(({ params }) => params.q)).toEqual(['60', '60']);
  });
});

describe('image objects', () => {
  test('builds the URL from an asset reference and infers the dimensions', () => {
    const result = props({ src: { asset: { _ref: assetRef('plain') } }, ...project, alt: '' });
    expect([result.width, result.height]).toEqual([2000, 1000]);
    expect(result.src).toBe(`${cdn}/plain-2000x1000.jpg?w=3840&h=1920&auto=format&fit=min`);
  });

  test('accepts the null members sanity typegen generates', () => {
    const src = {
      asset: { _ref: assetRef('nullish'), _type: 'reference' },
      crop: null,
      hotspot: null
    };
    expect(props({ src, ...project, width: 800, alt: '' }).height).toBe(400);
  });

  test('applies the Studio crop and adjusts the dimensions', () => {
    const result = props({
      src: {
        asset: { _ref: assetRef('cropped', '2000x3000') },
        crop: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 }
      },
      ...project,
      alt: ''
    });
    expect([result.width, result.height]).toEqual([1600, 2400]);
    expect(paramsOf(result.src).rect).toBe('200,300,1600,2400');
  });

  test('positions the crop around the hotspot when the aspect ratio differs', () => {
    const result = props({
      src: {
        asset: { _ref: assetRef('hotspotted', '2000x3000') },
        crop: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 },
        hotspot: { x: 0.75, y: 0.25, width: 0.2, height: 0.2 }
      },
      ...project,
      width: 800,
      height: 400,
      alt: ''
    });
    expect(
      candidates(result.srcset).map(
        ({ descriptor, params }) => `${params.rect} ${params.w}x${params.h} ${descriptor}`
      )
    ).toEqual(['200,350,1600,800 828x414 1x', '200,350,1600,800 1920x960 2x']);
  });

  test('reads the project from a dereferenced asset URL, keeping custom domains', () => {
    const url = `https://images.example.com/images/${projectId}/${dataset}/deref-2000x1000.jpg`;
    const result = props({ src: { asset: { url } }, alt: '' });
    expect(result.src).toBe(`${url}?w=3840&h=1920&auto=format&fit=min`);
  });

  test('accepts asset documents, references and asset ids', () => {
    const expected = `${cdn}/doc-2000x1000.jpg?w=3840&h=1920&auto=format&fit=min`;
    expect(props({ src: { _id: assetRef('doc') }, ...project, alt: '' }).src).toBe(expected);
    expect(props({ src: { _ref: assetRef('doc') }, ...project, alt: '' }).src).toBe(expected);
    expect(props({ src: assetRef('doc'), ...project, alt: '' }).src).toBe(expected);
  });

  test('ignores a document _id next to the asset', () => {
    const src = { _id: 'post-1', asset: { _ref: assetRef('field') } };
    expect(props({ src, ...project, alt: '' }).src).toContain('/field-2000x1000.jpg');
  });

  test('strips stega from asset references', () => {
    const src = { asset: { _ref: vercelStegaCombine(assetRef('stega'), { origin: 'sanity.io' }) } };
    expect(props({ src, ...project, alt: '' }).src).toContain('/stega-2000x1000.jpg?');
  });

  test('throws without a project or an asset', () => {
    expect(() => props({ src: { asset: { _ref: assetRef('x') } }, alt: '' })).toThrow(/projectId/);
    expect(() => props({ src: { asset: null }, ...project, alt: '' })).toThrow(/asset/);
  });

  test('isImageWithAsset narrows images that have an asset', () => {
    expect(isImageWithAsset({ asset: null })).toBe(false);
    expect(isImageWithAsset({ asset: { _ref: assetRef('x') } })).toBe(true);
  });
});

describe('queryParams', () => {
  test('merges CDN params, ignoring sizing params', () => {
    const result = props({
      src: { asset: { _ref: assetRef('params') }, hotspot: { x: 0.9, y: 0.5 } },
      ...project,
      width: 500,
      height: 500,
      queryParams: { blur: 50, sat: -100, w: 1, rect: '0,0,1,1' },
      alt: ''
    });
    expect(paramsOf(result.src)).toMatchObject({
      blur: '50',
      sat: '-100',
      rect: '1000,0,1000,1000'
    });
  });

  test('forwards fit to the builder before the rect is computed', () => {
    const result = props({
      src: { asset: { _ref: assetRef('fit') } },
      ...project,
      width: 500,
      height: 500,
      queryParams: { fit: 'max' },
      alt: ''
    });
    const built = createImageUrlBuilder(project)
      .image(assetRef('fit'))
      .width(500)
      .height(500)
      .fit('max')
      .url();
    expect(new URL(result.src).searchParams.getAll('fit')).toEqual(['max']);
    expect(paramsOf(result.src).rect).toBe(paramsOf(built).rect);
  });

  test('rejects an invalid fit mode', () => {
    expect(() =>
      props({ src: assetRef('bad'), ...project, queryParams: { fit: 'nope' }, alt: '' })
    ).toThrow(/queryParams.fit/);
  });
});

describe('fill', () => {
  const image = {
    asset: { _ref: assetRef('fill', '2000x3000') },
    crop: { top: 0, bottom: 0, left: 0.5, right: 0 },
    hotspot: { x: 0.9, y: 0.25 }
  };

  test('stretches over the parent with 100vw width candidates', () => {
    const result = props({ src: image, ...project, fill: true, alt: '' });
    expect(result.width).toBeUndefined();
    expect(result.sizes).toBe('100vw');
    expect(result.style).toMatch(/^position:absolute;height:100%;width:100%;inset:0;/);
    // The Studio crop is still applied
    expect(paramsOf(result.src).rect).toBe('1000,0,1000,3000');
  });

  test('defaults object-position to the hotspot inside the crop', () => {
    const result = props({ src: image, ...project, fill: true, alt: '' });
    expect(result.style).toContain('object-position:80% 25%');
  });

  test('mirrors the hotspot for a flip', () => {
    const result = props({
      src: image,
      ...project,
      fill: true,
      queryParams: { flip: 'h' },
      alt: ''
    });
    expect(result.style).toContain('object-position:20% 25%');
  });

  test('an explicit object-position wins', () => {
    const result = props({
      src: image,
      ...project,
      fill: true,
      style: 'object-position: top',
      alt: ''
    });
    expect(result.style).not.toContain('80%');
    expect(result.style).toContain('object-position: top');
  });
});

describe('placeholder', () => {
  const lqip = 'data:image/jpeg;base64,AAAA';
  const src = { asset: { _ref: assetRef('lqip'), metadata: { lqip } } };

  test('blur uses the lqip from the image object', () => {
    const result = props({ src, ...project, placeholder: 'blur', alt: '' });
    expect(result.style).toContain('background-image:url("data:image/svg+xml;charset=utf-8,');
    expect(result.style).toContain(`href='${lqip}'`);
    expect(result.style).toContain("viewBox='0 0 2000 1000'");
  });

  test('blur uses the lqip from an asset document', () => {
    const assetDocument = { _id: assetRef('doc'), metadata: { lqip } };
    const result = props({
      src: assetDocument,
      ...project,
      placeholder: 'blur',
      alt: ''
    });
    expect(result.style).toContain(`href='${lqip}'`);
  });

  test('blurDataURL wins over the lqip', () => {
    const result = props({
      src,
      ...project,
      placeholder: 'blur',
      blurDataURL: 'data:image/png;base64,BBBB',
      alt: ''
    });
    expect(result.style).toContain("href='data:image/png;base64,BBBB'");
  });

  test('renders no placeholder without an lqip or the placeholder prop', () => {
    expect(props({ src, ...project, alt: '' }).style).toBe('color:transparent');
    expect(
      props({ src: { asset: { _ref: assetRef('x') } }, ...project, placeholder: 'blur', alt: '' })
        .style
    ).toBe('color:transparent');
  });
});

describe('imageLoader', () => {
  test('scales h with w and defaults fit', () => {
    expect(imageLoader({ src: `${cdn}/a-10x10.jpg?w=100&h=50`, width: 640, quality: 80 })).toBe(
      `${cdn}/a-10x10.jpg?w=640&h=320&auto=format&fit=min&q=80`
    );
    expect(imageLoader({ src: `${cdn}/a-10x10.jpg`, width: 640 })).toBe(
      `${cdn}/a-10x10.jpg?auto=format&fit=max&w=640`
    );
  });
});

describe('<Image>', () => {
  test('server-renders the img with the blur placeholder and inferred dimensions', () => {
    const { body } = render(Image, {
      props: {
        src: {
          asset: { _ref: assetRef('ssr'), metadata: { lqip: 'data:image/jpeg;base64,AAAA' } }
        },
        ...project,
        alt: 'A building',
        placeholder: 'blur',
        class: 'rounded'
      }
    });
    expect(body).toContain('alt="A building"');
    expect(body).toContain('width="2000"');
    expect(body).toContain('height="1000"');
    expect(body).toContain('class="rounded"');
    expect(body).toContain('loading="lazy"');
    expect(body).toContain('background-image:url(');
  });

  test('preload adds a preload link and drops lazy loading', () => {
    const { head, body } = render(Image, {
      props: { src: `${cdn}/hero-2000x1000.jpg`, alt: '', sizes: '100vw', preload: true }
    });
    expect(head).toContain('rel="preload"');
    expect(head).toContain('as="image"');
    expect(head).toContain('imagesizes="100vw"');
    expect(body).not.toContain('loading=');
  });
});
