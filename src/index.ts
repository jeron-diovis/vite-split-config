import {
  ConfigEnv,
  mergeConfig,
  UserConfig,
  UserConfigExport,
  UserConfigFn,
} from 'vite'

type ViteConfig = ReturnType<UserConfigFn>

type ExtendConfig<R> = (base: UserConfig, env: ConfigEnv) => R
export type ChunkFactory = ExtendConfig<ViteConfig | void | Promise<void>>
export type ConfigChunk = ExtendConfig<Promise<UserConfig>>

export type DefineChunk = (config: ViteConfig | ChunkFactory) => ConfigChunk

export type UseChunks = (
  chunks: ConfigChunk[]
) => (config: UserConfigExport) => UserConfigFn

// ---

const isFunction = (x: unknown): x is Function => typeof x === 'function'

export { mergeConfig }

export const defineChunk: DefineChunk = cfg => async (base, env) => {
  const ext = await (isFunction(cfg) ? cfg(base, env) : cfg)
  return ext === undefined ? base : mergeConfig(base, ext)
}

export const useChunks: UseChunks = fns => init => env =>
  fns.reduce(
    async (cfg, chunk) => chunk(await cfg, env),
    isFunction(init) ? init(env) : init
  )
