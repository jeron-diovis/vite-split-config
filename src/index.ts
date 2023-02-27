import { ConfigEnv, UserConfig, UserConfigExport, UserConfigFn } from 'vite'

import {
  isFunction,
  mergeWith,
  partialRight,
  merge as base_merge,
} from 'lodash-es'

type ViteConfig = ReturnType<UserConfigFn>

type ExtendConfig<R> = (base: UserConfig, env: ConfigEnv) => R
export type ChunkFactory = ExtendConfig<ViteConfig | void | Promise<void>>
export type ConfigChunk = ExtendConfig<Promise<UserConfig>>

export type DefineChunk = (config: ViteConfig | ChunkFactory) => ConfigChunk

export type UseChunks = (
  chunks: ConfigChunk[]
) => (config: UserConfigExport) => UserConfigFn

// ---

export const merge: typeof base_merge = partialRight(
  mergeWith,
  (left: unknown, right: unknown) =>
    Array.isArray(right)
      ? Array.isArray(left)
        ? left.concat(right)
        : /**
           * It is important to explicitly "just return" right value in this case.
           * Otherwise lodash will deeply traverse it – and seemingly deep copy it – even if left value is undefined.
           * Which will fail equality checks like this one:
           * @see https://github.com/vitejs/vite-plugin-react/blob/6756b854ce0e87cf5407139a4120994c3cd5df2c/packages/plugin-react/src/index.ts#L182
           */
          right
      : undefined // fallback to internal logic of _.merge
)

export const defineChunk: DefineChunk = cfg => async (base, env) => {
  const ext = await (isFunction(cfg) ? cfg(base, env) : cfg)
  return ext === undefined ? base : merge(base, ext)
}

export const useChunks: UseChunks = fns => init => env =>
  fns.reduce(
    async (cfg, chunk) => chunk(await cfg, env),
    isFunction(init) ? init(env) : init
  )
