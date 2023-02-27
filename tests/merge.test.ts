import { merge } from '../src'

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

  it('should just assign if only one value is array', () => {
    let merged

    merged = merge({ a: 2 }, { a: [1, 2] })
    expect(merged).toStrictEqual({ a: [1, 2] })

    merged = merge({ a: [1, 2] }, { a: { b: 3, c: 4 } })
    expect(merged.a).toBeInstanceOf(Array)
    expect(merged.a).toHaveProperty('0', 1)
    expect(merged.a).toHaveProperty('1', 2)
    expect(merged.a).toHaveProperty('b', 3)
    expect(merged.a).toHaveProperty('c', 4)
  })

  it('should not deep copy right array elements, if left value is undefined', () => {
    const left = { a: undefined }

    const getter = vi.fn(() => 42)
    // eslint-disable-next-line
    const nestedObj = { get foo() { return getter() }}
    const right = { a: [nestedObj] }

    const merged = merge(left, right) as typeof right

    // must be _referentially_ equal, not structurally!
    expect(merged.a[0]).toBe(nestedObj)

    expect(getter).not.toBeCalled()
  })
})
