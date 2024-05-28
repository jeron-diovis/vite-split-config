import { ConfigEnv } from 'vite'
import { defineChunk, useChunks } from '../src'

describe('useChunks', () => {
  const VITE_ENV: ConfigEnv = { command: 'serve', mode: 'test' }

  it('should merge all chunks with base config', async () => {
    const chunk1 = defineChunk({
      server: { base: 'chunk' },
      envPrefix: ['foo'],
    })
    const chunk2 = defineChunk({
      server: { port: 3000 },
      envPrefix: ['bar'],
    })

    const defineConfig = useChunks([chunk1, chunk2])
    const configFn = defineConfig({ base: 'foo' })
    const config = configFn(VITE_ENV)

    expect(config).toBeInstanceOf(Promise)
    expect(await config).toStrictEqual({
      base: 'foo',
      server: { base: 'chunk', port: 3000 },
      envPrefix: ['foo', 'bar'],
    })
  })

  it('should accept plain objects and promises along with "defineChunk" funcs', async () => {
    const defineConfig = useChunks([
      { mode: 'mode' },
      Promise.resolve({ appType: 'spa' }),
    ])
    const configFn = defineConfig({ base: 'base' })
    const config = configFn(VITE_ENV)

    expect(await config).toStrictEqual({
      base: 'base',
      mode: 'mode',
      appType: 'spa',
    })
  })

  it('should return a sync value if no chunks specified', () => {
    const defineConfig = useChunks([])
    const configFn = defineConfig({})
    const config = configFn(VITE_ENV)
    expect(config).toStrictEqual({})
  })

  it('should pass base config, process.env and env to chunks', async () => {
    const chunk = defineChunk((base, { env, vite }) => ({
      base: `${base.envPrefix}-${env.FOO}-${vite.mode}-${vite.command}`,
    }))
    const defineConfig = useChunks([chunk])
    const configFn = defineConfig({ envPrefix: 'prefix' })
    process.env.FOO = 'foo'
    const config = await configFn({ command: 'serve', mode: 'test' })
    delete process.env.FOO
    expect(config).toStrictEqual({
      envPrefix: 'prefix',
      base: 'prefix-foo-test-serve',
    })
  })

  it('should have ".extend" method to add additional chunks to config', async () => {
    const defineConfig = useChunks([defineChunk({ base: 'base' })])
    expect(defineConfig.extend).toBeInstanceOf(Function)
    const defineConfig2 = defineConfig
      .extend([defineChunk({ appType: 'spa' })])
      .extend([{ mode: 'test' }])
    const configFn = defineConfig2({})
    const config = await configFn(VITE_ENV)
    expect(config).toStrictEqual({ base: 'base', appType: 'spa', mode: 'test' })
  })

  describe('define base config', () => {
    it('should accept promise', async () => {
      const defineConfig = useChunks([])
      const configFn = defineConfig(Promise.resolve({ base: 'base' }))
      const config = await configFn(VITE_ENV)
      expect(config).toStrictEqual({ base: 'base' })
    })

    it('should accept a function receiving a Vite env', async () => {
      const defineConfig = useChunks([])
      const configFn = defineConfig(env => ({ base: env.command }))
      const config = await configFn({ command: 'serve', mode: 'test' })
      expect(config).toStrictEqual({ base: 'serve' })
    })
  })
})
