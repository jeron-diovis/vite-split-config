import {
  ConfigEnv,
  mergeConfig,
  UserConfig,
  UserConfigExport,
  UserConfigFn,
  loadEnv,
} from 'vite'

type ViteConfig = ReturnType<UserConfigFn>

type ExtendConfig<R> = (
  base: UserConfig,
  cfg: {
    env: NodeJS.ProcessEnv
    vite: ConfigEnv
  }
) => R
export type ChunkFactory = ExtendConfig<ViteConfig | void | Promise<void>>
export type ConfigChunk = ExtendConfig<Promise<UserConfig>>

export type DefineChunk = (config: ViteConfig | ChunkFactory) => ConfigChunk

type ConfigResolver = (config: UserConfigExport) => UserConfigFn

interface UseChunksExtendable extends ConfigResolver {
  extend: (chunks: ConfigChunk[]) => UseChunksExtendable
}

export type UseChunks = (chunks: ConfigChunk[]) => UseChunksExtendable

// ---

const isFunction = (x: unknown): x is Function => typeof x === 'function'

export { mergeConfig }

export const defineChunk: DefineChunk = cfg => async (base, env) => {
  const ext = await (isFunction(cfg) ? cfg(base, env) : cfg)
  return ext === undefined ? base : mergeConfig(base, ext)
}

// ---

const createConfigResolver =
  (chunks: ConfigChunk[]): ConfigResolver =>
  init =>
  cfgEnv => {
    const env = loadEnv('all', process.cwd(), '')
    return chunks.reduce(
      async (cfg, chunk) => chunk(await cfg, { env, vite: cfgEnv }),
      isFunction(init) ? init(cfgEnv) : init
    )
  }

export const useChunks: UseChunks = chunks =>
  Object.assign(createConfigResolver(chunks), {
    extend: (extra: ConfigChunk[]) => useChunks([...chunks, ...extra]),
  })
