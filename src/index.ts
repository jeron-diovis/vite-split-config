import { ConfigEnv, UserConfig, UserConfigExport, UserConfigFn } from 'vite'

import { isFunction, mergeWith } from 'lodash/fp'

// ---

export const mergeConfig = mergeWith((a: unknown, b: unknown) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.concat(b)
  }
})

// ---

type ViteConfig = ReturnType<UserConfigFn>

type ExtendConfig<R> = (base: UserConfig, env: ConfigEnv) => R
export type ChunkFactory = ExtendConfig<ViteConfig | void | Promise<void>>
export type ConfigChunk = ExtendConfig<Promise<UserConfig>>

export type DefineChunk = (config: ViteConfig | ChunkFactory) => ConfigChunk

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
