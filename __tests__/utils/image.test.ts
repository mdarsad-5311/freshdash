import { resolveMediaUrl } from '../../utils/image';
import { API_BASE_URL } from '../../constants/config';

describe('resolveMediaUrl', () => {
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

  it('returns null for falsy, empty, or whitespace inputs', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
    expect(resolveMediaUrl('   ')).toBeNull();
  });

  it('returns absolute http and https URLs unchanged', () => {
    const httpsUrl = 'https://cdn.freshdash.com/products/apple.png';
    const httpUrl = 'http://mdarsad5311.pythonanywhere.com/media/products/tomato.png';

    expect(resolveMediaUrl(httpsUrl)).toBe(httpsUrl);
    expect(resolveMediaUrl(httpUrl)).toBe(httpUrl);
  });

  it('returns data and file URIs unchanged', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
    const fileUri = 'file:///var/mobile/Containers/Data/image.png';

    expect(resolveMediaUrl(dataUri)).toBe(dataUri);
    expect(resolveMediaUrl(fileUri)).toBe(fileUri);
  });

  it('prepends backend origin to relative media paths with leading slash', () => {
    const relativePath = '/media/products/alphonso_mango.jpg';
    expect(resolveMediaUrl(relativePath)).toBe(`${origin}${relativePath}`);
  });

  it('prepends backend origin and slash to relative media paths without leading slash', () => {
    const relativePath = 'media/products/baby_spinach.jpg';
    expect(resolveMediaUrl(relativePath)).toBe(`${origin}/${relativePath}`);
  });
});

