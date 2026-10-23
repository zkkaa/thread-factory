import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Folder/berkas yang tidak perlu dicek
  { ignores: ['dist', 'node_modules', 'vite', 'log.js'] },

  // Aturan umum untuk seluruh kode TypeScript
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Penjaga arsitektur: src/engine/ harus TypeScript murni dan deterministik
  // (lihat CLAUDE.md bagian 4 dan ARCHITECTURE.md)
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['phaser', 'react', 'react-dom'],
              message: 'engine/ harus TypeScript murni (tanpa phaser/react).',
            },
            {
              group: ['**/game/**', '**/ui/**', '**/controller/**'],
              message: 'engine/ tidak boleh mengimpor lapisan lain.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Pakai engine/prng.ts (berbasis seed), bukan Math.random().',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Engine harus deterministik; jangan pakai Date.now().',
        },
        {
          object: 'performance',
          property: 'now',
          message: 'Engine harus deterministik; jangan pakai performance.now().',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'engine/ tidak boleh memakai DOM.' },
        { name: 'document', message: 'engine/ tidak boleh memakai DOM.' },
        { name: 'setTimeout', message: 'Jam simulasi hanya di SimulationController.' },
        { name: 'setInterval', message: 'Jam simulasi hanya di SimulationController.' },
      ],
    },
  },
);
