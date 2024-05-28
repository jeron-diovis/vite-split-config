import { ConfigEnv, UserConfig } from 'vite'
import { defineChunk } from '../src'

describe('defineChunk', () => {
  const ENV = {
    env: { FOO: 'env_foo' },
    vite: { command: 'serve', mode: 'test' } as ConfigEnv,
  }

  describe('chunk', () => {
    it('should be a function', () => {
      const chunk = defineChunk({})
      expect(chunk).toBeInstanceOf(Function)
      expect(chunk).toHaveLength(2)
    })

    it('should return a promise', () => {
      const chunk = defineChunk({})
      expect(chunk({}, ENV)).toBeInstanceOf(Promise)
    })

    it('should resolve into merged config', async () => {
      const chunk = defineChunk({
        mode: 'chunk',
        envPrefix: ['bar'],
      })
      const baseConfig: UserConfig = {
        mode: 'base',
        envPrefix: ['foo'],
      }
      const newConfig = await chunk(baseConfig, ENV)
      expect(newConfig).toStrictEqual({
        mode: 'chunk',
        envPrefix: ['foo', 'bar'],
      })
    })

    it('should not mutate base config', async () => {
      const chunk = defineChunk({ mode: 'chunk' })
      const baseConfig: UserConfig = { mode: 'base' }
      await chunk(baseConfig, ENV)
      expect(baseConfig).toStrictEqual({ mode: 'base' })
    })
  })

  it('should accept a promise', async () => {
    const chunk = defineChunk(Promise.resolve({ mode: 'chunk' }))
    const baseConfig: UserConfig = { mode: 'base' }
    const newConfig = await chunk(baseConfig, ENV)
    expect(newConfig).toStrictEqual({ mode: 'chunk' })
  })

  describe('define as function', () => {
    it('should accept a function', async () => {
      const chunk = defineChunk(() => ({ mode: 'chunk' }))
      const baseConfig: UserConfig = { mode: 'base' }
      const newConfig = await chunk(baseConfig, ENV)
      expect(newConfig).toStrictEqual({ mode: 'chunk' })
    })

    it('should accept an async function', async () => {
      const chunk = defineChunk(async () => ({ mode: 'chunk' }))
      const baseConfig: UserConfig = { mode: 'base' }
      const newConfig = await chunk(baseConfig, ENV)
      expect(newConfig).toStrictEqual({ mode: 'chunk' })
    })

    it('should receive base config, process.env, and Vite ConfigEnv as arguments', async () => {
      const chunk = defineChunk((base, { env, vite }) => ({
        mode: base.appType,
        envPrefix: `${vite.command}-${vite.mode}-${env.FOO}`,
      }))

      const newConfig = await chunk(
        { appType: 'spa' },
        {
          env: { FOO: 'foo' },
          vite: { command: 'serve', mode: 'env' },
        }
      )
      expect(newConfig).toStrictEqual({
        appType: 'spa',
        mode: 'spa',
        envPrefix: 'serve-env-foo',
      })
    })

    it('should allow to imperatively mutate base config without explicit return', async () => {
      const chunk = defineChunk(base => {
        base.mode = 'mutable'
      })
      const base: UserConfig = {}
      const newConfig = await chunk(base, ENV)
      expect(newConfig).toStrictEqual({ mode: 'mutable' })
      expect(base).toStrictEqual({ mode: 'mutable' })
    })
  })
})
