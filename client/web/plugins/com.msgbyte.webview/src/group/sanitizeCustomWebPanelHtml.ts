import { FilterXSS, getDefaultWhiteList } from 'xss';

const semanticContainerAttributes = ['class', 'id', 'role', 'style'];

const xss = new FilterXSS({
  css: false,
  whiteList: {
    ...getDefaultWhiteList(),
    article: semanticContainerAttributes,
    body: semanticContainerAttributes,
    button: [
      'aria-label',
      'class',
      'disabled',
      'id',
      'style',
      'title',
      'type',
    ],
    div: semanticContainerAttributes,
    footer: semanticContainerAttributes,
    head: [],
    header: semanticContainerAttributes,
    html: ['class', 'dir', 'id', 'lang'],
    main: semanticContainerAttributes,
    meta: ['charset', 'content', 'name'],
    nav: semanticContainerAttributes,
    section: semanticContainerAttributes,
    style: ['media', 'type'],
  },
});

export function sanitizeCustomWebPanelHtml(html: string) {
  return xss.process(html);
}
