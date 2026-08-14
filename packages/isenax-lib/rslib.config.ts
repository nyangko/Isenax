import { defineConfig, type LibConfig } from '@rslib/core';
import { pluginReact } from '@rsbuild/plugin-react';

const packageJson = require('./package.json');

const lib = [
    {
      format: 'cjs',
      syntax: 'es2021',
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      output: {
        distPath: { root: './dist' },
      },
      style: {
        inject: false,
      },
    },
    {
      // Node-safe subset (schemas, types, reducers, config) with no DOM/CSS
      // dependencies, so it can be imported outside the browser (e.g. an MCP server).
      id: 'standalone',
      format: 'cjs',
      syntax: 'es2021',
      output: {
        distPath: { root: './dist' },
        target: 'node',
      },
      source: {
        entry: {
          standalone: './src/standaloneExports.ts',
        },
      },
    },
  ] as LibConfig[];

export default defineConfig({
  lib,
  plugins: [pluginReact()],
  source: {
    define: {
      PACKAGE_VERSION: JSON.stringify(packageJson.version),
      REPOSITORY_URL: JSON.stringify(packageJson.repository.url),
    },
  },
  resolve: {
    alias: {
      src: './src',
      components: './src/components',
      stores: './src/stores',
      styles: './src/styles',
      utils: './src/utils',
      hooks: './src/hooks',
      types: './src/types',
    },
  },
  output: {
    externals: ['react', 'react-dom'],
    target: 'node',
    filename: {
      css: 'styles.css',
    },
  },
});
