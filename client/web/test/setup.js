// mock
jest.mock('tailchat-shared/i18n');
jest.mock('tailchat-design/components/Icon', () => ({
  Icon: ({ icon }) => `[iconify icon="${icon}"]`,
}));
jest.mock('../src/components/Loadable');
jest.mock('../src/components/UserName');

const ignoreErroMessages = [
  /Warning.*not wrapped in act/,
  /PluginManifest validation/,
];

// https://github.com/testing-library/react-testing-library#suppressing-unnecessary-warnings-on-react-dom-168
const originalError = console.error;
console.error = (...args) => {
  if (ignoreErroMessages.some((re) => re.test(args[0]))) {
    return;
  }

  originalError.call(console, ...args);
};

// Mock location
delete window.location;
window.location = new URL('https://www.example.com/foo/index');

// jsdom has no ResizeObserver (cmdk needs it)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom has no responsive media-query implementation (Shadcn use-mobile uses it)
window.matchMedia =
  window.matchMedia ||
  function matchMedia(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    };
  };

// jsdom 16 has no PointerEvent (Base UI dispatches one for checkbox clicks)
window.PointerEvent = window.PointerEvent || MouseEvent;

// jsdom has no scrollIntoView (cmdk scrolls the selected item into view)
Element.prototype.scrollIntoView =
  Element.prototype.scrollIntoView || function () {};
