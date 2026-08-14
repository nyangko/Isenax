import { getBuiltinIcon, stripBuiltinIconUrls, hydrateBuiltinIconUrls } from '../iconLibrary';

describe('iconLibrary', () => {
  test('getBuiltinIcon resolves a known id and its url is a real data URI', () => {
    const icon = getBuiltinIcon('storage');

    expect(icon).toBeDefined();
    expect(icon?.url.startsWith('data:image')).toBe(true);
  });

  test('getBuiltinIcon returns undefined for an unknown id', () => {
    expect(getBuiltinIcon('not-a-real-icon-id')).toBeUndefined();
  });

  test('stripBuiltinIconUrls drops the url for a known icon, leaves an unknown one untouched', () => {
    const icons = [
      { id: 'storage', name: 'Storage', url: 'data:image/svg+xml;base64,AAAA' },
      { id: 'my-custom-logo', name: 'Custom', url: 'data:image/png;base64,BBBB' }
    ];

    const [builtin, custom] = stripBuiltinIconUrls(icons);

    expect(builtin.url).toBeUndefined();
    expect(builtin.id).toBe('storage');
    expect(custom.url).toBe('data:image/png;base64,BBBB');
  });

  test('hydrateBuiltinIconUrls restores a known icon missing its url, leaves an existing url alone', () => {
    const icons = [
      { id: 'storage', name: 'Storage' },
      { id: 'my-custom-logo', name: 'Custom', url: 'data:image/png;base64,BBBB' }
    ];

    const [builtin, custom] = hydrateBuiltinIconUrls(icons);

    expect(builtin.url).toBe(getBuiltinIcon('storage')?.url);
    expect(custom.url).toBe('data:image/png;base64,BBBB');
  });

  test('hydrateBuiltinIconUrls leaves an unresolvable missing url alone (no crash)', () => {
    const icons: Array<{ id: string; name: string; url?: string }> = [
      { id: 'not-a-real-icon-id', name: 'Ghost' }
    ];

    const [ghost] = hydrateBuiltinIconUrls(icons);

    expect(ghost.url).toBeUndefined();
  });

  test('strip then hydrate round-trips back to the original url', () => {
    const original = { id: 'storage', name: 'Storage', url: getBuiltinIcon('storage')?.url };

    const [stripped] = stripBuiltinIconUrls([original]);
    const [restored] = hydrateBuiltinIconUrls([stripped]);

    expect(restored.url).toBe(original.url);
  });
});
