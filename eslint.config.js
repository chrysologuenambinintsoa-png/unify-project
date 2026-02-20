const nextPlugin = require('@next/eslint-plugin');
const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      // Disable the inline styles rule to allow dynamic positioning in LiveStreamer
      '@next/next/no-css-invalid-selector': 'off',
    },
  },
];
