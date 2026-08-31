// Used by the mini-star plugin bundles only — the main webpack build carries
// an inline PostCSS config (see build/webpack.config.ts) that adds the
// Tailwind 4 pipeline. Plugins must NOT process Tailwind themselves: their
// utility classes are generated into the main app stylesheet through the
// content globs in tailwind.config.js.
module.exports = {
  plugins: ['autoprefixer'],
};
