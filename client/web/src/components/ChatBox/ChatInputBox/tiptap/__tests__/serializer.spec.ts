import {
  collectMentions,
  docToMessage,
  messageToDoc,
} from '../serializer';

jest.mock('@/plugin/common', () => ({
  getMessageTextDecorators: () => ({
    mention: (id: string, display: string) => `[at=${id}]${display}[/at]`,
    url: (url: string, text: string) => `[url=${url}]${text}[/url]`,
  }),
}));

describe('Tiptap chat message serializer', () => {
  test('round-trips multiline text and mention nodes', () => {
    const message =
      'Hello [at=user-1]Tim[/at]\nSee [url=panel-1]#Lobby[/url]';
    const doc = messageToDoc(message);

    expect(docToMessage(doc)).toBe(message);
  });

  test('collects user mentions from nested document content', () => {
    const doc = messageToDoc(
      '[at=user-1]Tim[/at] and [at=user-2]Alex[/at]'
    );

    expect(collectMentions(doc)).toEqual(['user-1', 'user-2']);
  });
});
