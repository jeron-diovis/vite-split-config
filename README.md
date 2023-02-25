<div align="center">
<img src="logo.png" alt="logo" />
<h1>
vite-split-config
</h1>
Split monolithic config file into dedicated chunks.
</div>

---

## Motivation

Config files tend to grow. 

Eventually there appears more and more specialized settings, more plugin imports and options for them, more local helpers and variables used once somewhere 300 lines below, more comments, and so on. 

Left like that, config turns into [leviathan](https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/webpack.config.js), taking forever to figure it out and update something. Especially when the issue you want to address requires updating [multiple config sections](https://stackoverflow.com/a/72440811/3437433).

It's not hard at all to split config apart and merge that chunks. But anyway it's some extra complexity to care about – which nobody likes to bring.

This solution takes away that low-level logic from your sources.

## Table of Contents
- [Installation](#Installation)
- [Usage](#Usage)
- [API](#API)
  - [defineChunk](#definechunk) 
  - [useChunks](#usechunks) 
  - [merge](#merge)
- [Hints](#Hints)
- [LICENSE](#LICENSE)

## Installation

```sh
npm install -D vite-split-config
```

```sh
yarn add -D vite-split-config
```

## Usage

Define chunks dedicated to certain configuration aspects:

```ts
// my-chunk.ts
import { defineChunk } from 'vite-split-config'
import checker from 'vite-plugin-checker'

export const useLint = defineChunk({
  plugins: [
    checker({
      typescript: true,
      eslint: { 
        lintCommand: '...' 
      },
      stylelint: { 
        lintCommand: '...' 
      },
    })
  ]
})
```

```ts
// my-other-chunk.ts
import { defineChunk } from 'vite-split-config'
import criticalCSS from 'rollup-plugin-critical'
import customSelectors from 'postcss-custom-selectors'

export const useStyles = defineChunk({
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        customSelectors({
          /*...*/
        }),
      ]
    }
  },
  plugins: [
    criticalCSS({
      /*...*/
    }),
  ]
})
```

Then combine them together, and provide a basic config:

```ts
// vite.config.ts
import { useChunks } from 'vite-split-config'

import { useLint } from './my-chunk'
import { useStyles } from './my-other-chunk'

const defineConfig = useChunks([ useLint, useStyles ])

export default defineConfig({
  resolve: {
    alias: {/*...*/}
  },
  base: '/',
  /* other basic settings */
})
```

Chunks will be merged recursively over each other, starting with the basic config, in order you specified in `useChunks`
.

## API

**`type ViteConfig = Vite.UserConfig | Promise<Vite.UserConfig>`**

**`type ExtendConfig<R> = (base: Vite.UserConfig, env: Vite.ConfigEnv) => R`**

**`type Chunk = ExtendConfig<Promise<Vite.UserConfig>>`**

### `defineChunk`

**`function defineChunk(config: ViteConfig): Chunk`**

**`function defineChunk(config: ExtendConfig<ViteConfig>): Chunk`**

**`function defineChunk(config: ExtendConfig<void | Promise<void>>): Chunk`**

```ts
// basic usage:
defineChunk({ /* Vite.UserConfig options here */ })

// async usage:
import { UserConfig } from 'vite'
import detectPort from 'detect-port'
defineChunk(new Promise<UserConfig>((resolve, reject) => {
    detectPort(3000, (err, freePort) => {
        if (err) reject(err)
        else resolve({
          server: { port: freePort },
        })
    })
}))

// depending on base config (can also return a promise):
defineChunk(base => ({
    define: { __APP_TYPE__: JSON.stringify(base.appType) }
}))

// depending on Vite env:
defineChunk((base, env) => ({
    logLevel: env.mode === 'test' ? 'silent' : 'info'
}))

// imperative update:
defineChunk(base => {
    base.plugins.push(myPlugin())
    // don't need to return value explicitly
})
```

### `useChunks`

**`function useChunks(chunks: Chunk[]): (base: Vite.UserConfigExport) => Vite.UserConfigFn`**

```ts
// vite.config.ts
const defineConfig = useChunks([ chunk1, chunk2, /* ... */ ])
export default defineConfig({ /* basic config */ })
```

Return value of `useChunks` is basically equivalent
to [`vite.defineConfig`](https://vitejs.dev/config/#config-intellisense) function, so you may use it as drop-in
replacement, with all the same features – defining [conditional](https://vitejs.dev/config/#conditional-config)
or [async](https://vitejs.dev/config/#async-config) basic config.

The only difference is that it always returns a function – so that Vite will feed it with
its [env params](https://vitejs.dev/config/#conditional-config), which then will be passed to every chunk.

### `merge`

**`function merge(a: object, b: object): object`**

Function used internally to recursively merge chunks together. Exported just in case, if you want to do something custom.

## Hints

### merging strategy

Merging done using immutable version of [`_.merge`](https://lodash.com/docs/4.17.15#merge), with one difference: if both values are arrays,
they are simply concatenated, without recursively looking into their elements.

Thus, you can't declaratively override one array with another.
But, the purpose of this tool is __extension__, not __overriding__. If some of your chunks are trying to specify
different value for the same option, you're probably doing something wrong.

However, if you absolutely need to __override__ an array value, you may use chunk callback definition and
imperatively mutate parent config. See example in [`defineChunk`](#definechunk) section.

### importing chunk modules
When importing local modules into `vite.config`, you may face complaints from your editor:
<img width="1128" alt="Screenshot 2023-02-24 at 22 45 17" src="https://user-images.githubusercontent.com/2756868/221294801-d8518856-3be6-4f83-ab57-5c2f6319b7b0.png">
It doesn't affect build in any way, but is annoying to see.

How to fix it is explained in warning itself: just `include` your files in `tsconfig.node.json`.

## LICENSE

MIT
