import { mergeConfig as merge } from '../src'

describe('merge', () => {
  it('should recursively merge objects', () => {
    const merged = merge({ a: { b: 1, c: 2 } }, { a: { c: 3, d: 4 } })
    expect(merged).toStrictEqual({
      a: { b: 1, c: 3, d: 4 },
    })
  })

  it('should concat two arrays', () => {
    const merged = merge({ a: { b: [1, 2] } }, { a: { b: [3, 4] } })
    expect(merged).toStrictEqual({
      a: { b: [1, 2, 3, 4] },
    })
  })

  it('should squash everything into array if one value is an array', () => {
    let merged

    merged = merge({ a: 0 }, { a: [1, 2] })
    expect(merged).toStrictEqual({ a: [0, 1, 2] })

    merged = merge({ a: [1, 2] }, { a: { b: 3, c: 4 } })
    expect(merged).toStrictEqual({ a: [1, 2, { b: 3, c: 4 }] })
  })

  it('should not deep copy neither left nor right array elements', () => {
    const obj1 = { a: 1 }
    const obj2 = { a: 2 }
    const left = { xs: [obj1] }
    const right = { xs: [obj2] }
    const merged = merge(left, right)
    expect(merged.xs[0]).toBe(obj1)
    expect(merged.xs[1]).toBe(obj2)
  })

  it('should not deep copy right array elements when left value is undefined', () => {
    const left = { a: undefined }

    const obj = { b: 1 }
    const right = { a: [obj] }

    const merged = merge(left, right)
    // must be _referentially_ equal, not structurally!
    expect(merged.a[0]).toBe(obj)
  })
})
