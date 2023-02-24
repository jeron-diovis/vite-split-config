import { mergeConfig } from '../src'

describe('mergeConfig', () => {
  it('should recursively merge objects', () => {
    const merged = mergeConfig({ a: { b: 1, c: 2 } }, { a: { c: 3, d: 4 } })
    expect(merged).toStrictEqual({
      a: { b: 1, c: 3, d: 4 },
    })
  })

  it('should concat arrays', () => {
    const merged = mergeConfig({ a: { b: [1, 2] } }, { a: { b: [3, 4] } })
    expect(merged).toStrictEqual({
      a: { b: [1, 2, 3, 4] },
    })
  })
})
