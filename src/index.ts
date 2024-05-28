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
export type ConfigChunkFn = ExtendConfig<Promise<UserConfig>>
export type ConfigChunk = ConfigChunkFn | ViteConfig

export type DefineChunk = (config: ViteConfig | ChunkFactory) => ConfigChunkFn

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
  (chunks: ConfigChunkFn[]): ConfigResolver =>
  base =>
  viteEnv => {
    const env = loadEnv('all', process.cwd(), '')
    return chunks.reduce(
      async (cfg, chunk) => chunk(await cfg, { env, vite: viteEnv }),
      isFunction(base) ? base(viteEnv) : base
    )
  }

const normalizeChunk = (chunk: ConfigChunk): ConfigChunkFn =>
  isFunction(chunk) ? chunk : defineChunk(chunk)

export const useChunks: UseChunks = chunks =>
  Object.assign(createConfigResolver(chunks.map(normalizeChunk)), {
    extend: (extra: ConfigChunk[]) => useChunks([...chunks, ...extra]),
  })
