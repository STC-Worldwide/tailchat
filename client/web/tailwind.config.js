// tailwind.config.js
// Reference: https://www.tailwindcss.cn/docs/configuration
// 默认配置文件: https://unpkg.com/browse/tailwindcss@2.2.7/stubs/defaultConfig.stub.js

const plugin = require('tailwindcss/plugin');
const path = require('path');

const customTheme = {
  boxShadow: {
    normal: 'rgba(0, 0, 0, 0.15) 0 0 8px',
    elevationStroke: '0 0 0 1px rgba(4,4,5,0.15)',
    elevationLow:
      '0 1px 0 rgba(4,4,5,0.2),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)',
    elevationMedium: '0 4px 4px rgba(0,0,0,0.16)',
    elevationHigh: '0 8px 16px rgba(0,0,0,0.24)',
  },
};

const tailchat = plugin(({ addUtilities, matchUtilities }) => {
  // Reference: https://www.tailwindcss.cn/docs/plugins#adding-utilities
  const newUtilities = {
    '.thin-line-bottom': {
      '&::after': {
        content: '" "',
        position: 'absolute',
        display: 'block',
        bottom: '1px',
        left: 0,
        right: 0,
        height: '1px',
        boxShadow: customTheme.boxShadow.elevationLow,
        // zIndex: 1,
        pointerEvents: 'none',
      },
    },
    '.thin-scrollbar': {
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-thumb': {
        borderWidth: '2px',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-track': {
        borderWidth: '2px',
        borderRadius: '4px',
      },
    },
  };

  addUtilities(newUtilities);

  addUtilities(
    {
      '.overflow-smart': {
        overflow: ['auto', 'overlay'],
      },
      '.overflow-x-smart': {
        'overflow-x': ['auto', 'overlay'],
      },
      '.overflow-y-smart': {
        'overflow-y': ['auto', 'overlay'],
      },
    },
    {
      variants: ['hover'],
    }
  );

  // Fork from https://github.com/ItzAfroBoy/tailwindcss-zoom/blob/master/index.js
  const percents = [
    {
      key: '1/2',
      value: '50%',
    },
    {
      key: '1/3',
      value: '33.333333%',
    },
    {
      key: '2/3',
      value: '66.666667%',
    },
    {
      key: '1/4',
      value: '25%',
    },
    {
      key: '3/4',
      value: '75%',
    },
    {
      key: '1/5',
      value: '20%',
    },
    {
      key: '2/5',
      value: '40%',
    },
    {
      key: '3/5',
      value: '60%',
    },
    {
      key: '4/5',
      value: '80%',
    },
    {
      key: '1/6',
      value: '16.666667%',
    },
    {
      key: '5/6',
      value: '83.333333%',
    },
    {
      key: '1/10',
      value: '10%',
    },
    {
      key: '3/10',
      value: '30%',
    },
    {
      key: '7/10',
      value: '70%',
    },
    {
      key: '9/10',
      value: '90%',
    },
    {
      key: 'full',
      value: '100%',
    },
    {
      key: '1.1',
      value: '110%',
    },
    {
      key: '1.2',
      value: '120%',
    },
    {
      key: '1.25',
      value: '125%',
    },
    {
      key: '1.5',
      value: '150%',
    },
    {
      key: '1.75',
      value: '175%',
    },
    {
      key: '2',
      value: '200%',
    },
  ];

  // matchUtilities instead of addUtilities+e(): Tailwind 4's plugin compat no
  // longer provides the `e` escape helper, and matchUtilities handles
  // fraction/decimal keys (zoom-1/2, zoom-1.5) itself.
  matchUtilities(
    {
      zoom: (value) => ({ zoom: value }),
    },
    {
      values: Object.fromEntries(
        percents.map((item) => [item.key, item.value])
      ),
    }
  );
});

module.exports = {
  // v2 `purge` only scanned ./src, so classes used solely in plugins or the
  // design package were never generated in production builds. These globs fix
  // that: every surface that renders against the main app's stylesheet is
  // scanned.
  content: [
    path.resolve(__dirname, './src/**/*.{js,jsx,ts,tsx}'),
    path.resolve(__dirname, './plugins/*/src/**/*.{js,jsx,ts,tsx}'),
    path.resolve(__dirname, '../packages/design/components/**/*.{ts,tsx}'),
    path.resolve(
      __dirname,
      '../../server/plugins/*/web/plugins/*/src/**/*.{js,jsx,ts,tsx}'
    ),
  ],
  darkMode: 'class', // or 'media'
  important: '#app',
  theme: {
    screens: {
      sm: { min: '640px' },
      md: { min: '768px' },
      lg: { min: '1024px' },
      xl: { min: '1280px' },
      '2xl': { min: '1536px' },
      mobile: { max: '639px' }, // alias
      desktop: { min: '640px' }, // alias
    },
    extend: {
      colors: {
        inherit: {
          DEFAULT: 'inherit',
        },
        // navbar/sidebar/content/typography moved to OKLCH tokens in
        // src/styles/tailwind.css @theme (facelift design-token pass)
      },
      borderRadius: {
        '1/2': '50%',
      },
      spacing: {
        18: '4.5rem',
        142: '35.5rem',
        160: '40rem',
      },
      lineHeight: {
        13: '3.25rem',
      },
      boxShadow: {
        ...customTheme.boxShadow,
      },
      transitionProperty: {
        width: 'width',
      },
      zIndex: {
        '-1': '-1',
      },
    },
  },
  // v2 `variants` config removed: every variant is available on every utility
  // in Tailwind 3.
  plugins: [tailchat],
};
