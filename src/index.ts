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
export type ConfigChunk = ChunkFn<Promise<UserConfig>>

export type DefineChunk = (
  config: PromisedConfig | ChunkInitializer
) => ConfigChunk

export type UseChunks = (
  chunks: ConfigChunk[]
) => (config: UserConfigExport) => UserConfigFn

// ---

export const defineChunk: DefineChunk = cfg => async (base, env) => {
  const ext = await (isFunction(cfg) ? cfg(base, env) : cfg)
  return ext === undefined ? base : mergeConfig(base, ext)
}

export const useChunks: UseChunks = fns => init => env =>
  fns.reduce(
    async (cfg, chunk) => chunk(await cfg, env),
    isFunction(init) ? init(env) : init
  )
