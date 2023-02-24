import { ConfigEnv, UserConfig, UserConfigExport, UserConfigFn } from 'vite'

import { isFunction, merge, mergeWith, partialRight } from 'lodash-es'

// ---

export const mergeConfig: typeof merge = partialRight(
  mergeWith,
  (a: unknown, b: unknown) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.concat(b)
    }
  }
)

// ---

type PromisedConfig = ReturnType<UserConfigFn>

type ChunkFn<R> = (base: UserConfig, env: ConfigEnv) => R
export type ChunkInitializer = ChunkFn<PromisedConfig | void | Promise<void>>
export type ConfigChunk = ChunkFn<PromisedConfig>

export type DefineChunk = (
  config: PromisedConfig | ChunkInitializer
) => ConfigChunk

export type UseChunks = (
  chunks: ConfigChunk[]
) => (config: UserConfigExport) => UserConfigFn

// ---

/**
 * <pre>
 *   useConfig({ plugins: ... })
 *
 *   useConfig((base, env) => ({
 *     plugins: ...
 *   }))
 *
 *   useConfig((base, env) => {
 *     base.plugins.push(...)
 *   })
 * </pre>
 */
export const defineChunk: DefineChunk = cfg => async (base, env) => {
  const ext = await (isFunction(cfg) ? cfg(base, env) : cfg)
  // `undefined` assumes that config has been mutated
  return ext === undefined ? base : mergeConfig(base, ext)
}

/**
 * <pre>
 *   // somewhere in dedicated modules
 *   const plugin1 = defineChunk(...)
 *   const plugin2 = defineChunk(...)
 *   const configure = useChunks([ plugin1, plugin2 ])
 *
 *   // vite.config.ts
 *   defineConfig(configure({ ...your basic config... }))
 *   defineConfig(configure(env => ({ ... })))
 * </pre>
 */
export const useChunks: UseChunks = fns => init => env =>
  fns.reduce(
    async (cfg, chunk) => chunk(await cfg, env),
    isFunction(init) ? init(env) : init
  )
