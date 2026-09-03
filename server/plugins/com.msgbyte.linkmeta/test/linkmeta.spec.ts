import { createTestServiceBroker } from '../../../test/utils';
import LinkmetaService from '../services/linkmeta.service';

/**
 * The previous version of this suite fetched baidu.com and w3schools.com and
 * compared the live responses against snapshots. Those hosts now answer with
 * "Access Denied" pages or time out from CI, so the network is mocked and the
 * suite verifies the service's own behaviour: caching, image re-hosting and
 * special-site overrides.
 */
const previews: Record<string, any> = {
  'https://example.com/?fortest': {
    url: 'https://example.com/?fortest',
    title: 'Example Domain',
    siteName: 'Example',
    description: 'An example page',
    mediaType: 'website',
    contentType: 'text/html',
    images: ['https://example.com/og.png'],
    videos: [],
    favicons: ['https://example.com/favicon.ico'],
  },
  'https://example.com/mov_bbb.mp4': {
    url: 'https://example.com/mov_bbb.mp4',
    mediaType: 'video',
    contentType: 'video/mp4',
    favicons: [],
  },
  'https://example.com/pic_trulli.jpg': {
    url: 'https://example.com/pic_trulli.jpg',
    mediaType: 'image',
    contentType: 'image/jpeg',
    favicons: [],
  },
  'https://example.com/horse.ogg': {
    url: 'https://example.com/horse.ogg',
    mediaType: 'video',
    contentType: 'video/ogg',
    favicons: [],
  },
  'https://example.com/horse.mp3': {
    url: 'https://example.com/horse.mp3',
    mediaType: 'audio',
    contentType: 'audio/mpeg',
    favicons: [],
  },
};

const mockFetchLinkPreview = jest.fn(async (url: string) => {
  const preview = previews[url];
  if (!preview) {
    throw new Error(`no mock preview for ${url}`);
  }

  // the service mutates images[0]; hand out a copy each time
  return JSON.parse(JSON.stringify(preview));
});
const mockFetchSpecialWebsiteMeta = jest.fn(async (_url: string) => ({}));

jest.mock('../utils/fetchLinkPreview', () => ({
  fetchLinkPreview: (url: string) => mockFetchLinkPreview(url),
}));
jest.mock('../utils/specialWebsiteMeta', () => ({
  fetchSpecialWebsiteMeta: (url: string) => mockFetchSpecialWebsiteMeta(url),
}));

describe('Test "plugin:com.msgbyte.linkmeta" service', () => {
  const rehostedImageUrl = 'https://static.example.com/rehosted.png';
  const { broker, service } = createTestServiceBroker<LinkmetaService>(
    LinkmetaService,
    {
      contextCallMockFn(actionName) {
        if (actionName === 'file.saveFileWithUrl') {
          return { url: rehostedImageUrl };
        }
      },
    }
  );

  afterEach(async () => {
    await service.adapter.model.deleteMany({
      url: { $in: Object.keys(previews) },
    });
    mockFetchLinkPreview.mockClear();
    mockFetchSpecialWebsiteMeta.mockClear();
  });

  describe('Test "plugin:com.msgbyte.linkmeta.fetch"', () => {
    test('fetches, re-hosts the first image, stores, then serves from cache', async () => {
      const url = 'https://example.com/?fortest';
      const meta: any = await broker.call('plugin:com.msgbyte.linkmeta.fetch', {
        url,
      });

      expect(meta).toMatchObject({
        url,
        isCache: false,
        title: 'Example Domain',
        siteName: 'Example',
        description: 'An example page',
        mediaType: 'website',
        contentType: 'text/html',
        images: [rehostedImageUrl],
        videos: [],
        favicons: ['https://example.com/favicon.ico'],
      });
      expect(mockFetchLinkPreview).toHaveBeenCalledTimes(1);

      const stored = await service.adapter.model.findOne({ url });
      expect(stored?.data).toMatchObject({ images: [rehostedImageUrl] });

      const metaWithCache: any = await broker.call(
        'plugin:com.msgbyte.linkmeta.fetch',
        { url }
      );
      expect(metaWithCache).toMatchObject({ url, isCache: true });
      expect(mockFetchLinkPreview).toHaveBeenCalledTimes(1);
    });

    test('applies special-website overrides on top of the preview', async () => {
      const url = 'https://example.com/?fortest';
      mockFetchSpecialWebsiteMeta.mockResolvedValueOnce({
        title: 'Overridden title',
      });

      const meta: any = await broker.call('plugin:com.msgbyte.linkmeta.fetch', {
        url,
      });

      expect(meta.title).toBe('Overridden title');
      expect(mockFetchSpecialWebsiteMeta).toHaveBeenCalledWith(url);
    });

    test.each([
      ['pure video', 'https://example.com/mov_bbb.mp4', 'video', 'video/mp4'],
      [
        'pure image',
        'https://example.com/pic_trulli.jpg',
        'image',
        'image/jpeg',
      ],
      ['pure ogg', 'https://example.com/horse.ogg', 'video', 'video/ogg'],
      ['pure mp3', 'https://example.com/horse.mp3', 'audio', 'audio/mpeg'],
    ])(
      '%s passes media metadata through',
      async (_name, url, mediaType, contentType) => {
        const meta: any = await broker.call(
          'plugin:com.msgbyte.linkmeta.fetch',
          {
            url,
          }
        );

        expect(meta).toMatchObject({
          url,
          isCache: false,
          mediaType,
          contentType,
        });
        // no images, so nothing was re-hosted
        expect(meta).not.toHaveProperty('images');
      }
    );
  });
});
