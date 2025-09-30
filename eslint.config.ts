// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import pkgSvelteConfig from './packages/sanity-sveltekit/svelte.config.js';
import appSvelteConfig from './apps/test/svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));
const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  // Respect .gitignore
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      'eslint.config.ts',
      'vite.config.ts',
      'svelte.config.js',
      '**/sanity.cli.ts',
      '**/*.config.js',
      '**/*.config.ts'
    ]
  },
  // Base JS + TS
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Svelte flat presets
  ...svelte.configs['flat/recommended'],
  ...svelte.configs['flat/prettier'],

  // Global language options
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        // Let typescript-eslint resolve per-package projects automatically
        projectService: true,
        // optional (safe if you keep it)
        tsconfigRootDir,
        extraFileExtensions: ['.svelte']
      }
    }
  },

  // Per package svelte configs
  {
    files: ['packages/sanity-sveltekit/**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        svelteConfig: pkgSvelteConfig
      }
    }
  },
  {
    files: ['apps/test/**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        svelteConfig: appSvelteConfig
      }
    }
  },

  // Repo rules
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },

  // Keep last
  prettier
);
