import { ConfigEnv, UserConfig } from 'vite'
import { defineChunk } from '../src'

describe('defineChunk', () => {
  const VITE_ENV: ConfigEnv = { command: 'serve', mode: 'test' }

  describe('chunk', () => {
    it('should be a function', () => {
      const chunk = defineChunk({})
      expect(chunk).toBeInstanceOf(Function)
      expect(chunk).toHaveLength(2)
    })

    it('should return a promise', () => {
      const chunk = defineChunk({})
      expect(chunk({}, VITE_ENV)).toBeInstanceOf(Promise)
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
      const newConfig = await chunk(baseConfig, VITE_ENV)
      expect(newConfig).toStrictEqual({
        mode: 'chunk',
        envPrefix: ['foo', 'bar'],
      })
    })

    it('should not mutate base config', async () => {
      const chunk = defineChunk({ mode: 'chunk' })
      const baseConfig: UserConfig = { mode: 'base' }
      await chunk(baseConfig, VITE_ENV)
      expect(baseConfig).toStrictEqual({ mode: 'base' })
    })
  })

  it('should accept a promise', async () => {
    const chunk = defineChunk(Promise.resolve({ mode: 'chunk' }))
    const baseConfig: UserConfig = { mode: 'base' }
    const newConfig = await chunk(baseConfig, VITE_ENV)
    expect(newConfig).toStrictEqual({ mode: 'chunk' })
  })

  describe('define as function', () => {
    it('should accept a function', async () => {
      const chunk = defineChunk(() => ({ mode: 'chunk' }))
      const baseConfig: UserConfig = { mode: 'base' }
      const newConfig = await chunk(baseConfig, VITE_ENV)
      expect(newConfig).toStrictEqual({ mode: 'chunk' })
    })

    it('should accept an async function', async () => {
      const chunk = defineChunk(async () => ({ mode: 'chunk' }))
      const baseConfig: UserConfig = { mode: 'base' }
      const newConfig = await chunk(baseConfig, VITE_ENV)
      expect(newConfig).toStrictEqual({ mode: 'chunk' })
    })

    it('should receive base config and Vite env as arguments', async () => {
      const chunk = defineChunk((base, env) => ({
        mode: base.appType,
        envPrefix: `${env.command}-${env.mode}`,
      }))
      const newConfig = await chunk(
        { appType: 'spa' },
        { command: 'serve', mode: 'env' }
      )
      expect(newConfig).toStrictEqual({
        appType: 'spa',
        mode: 'spa',
        envPrefix: 'serve-env',
      })
    })

    it('should allow to imperatively mutate base config without explicit return', async () => {
      const chunk = defineChunk(base => {
        base.mode = 'mutable'
      })
      const base: UserConfig = {}
      const newConfig = await chunk(base, VITE_ENV)
      expect(newConfig).toStrictEqual({ mode: 'mutable' })
      expect(base).toStrictEqual({ mode: 'mutable' })
    })
  })
})
