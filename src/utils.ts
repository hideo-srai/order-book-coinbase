export type CompareFunc<T> = (a: T, b: T) => boolean

export function lt<T>(a: T, b: T) {
  return a < b
}

export function gt<T>(a: T, b: T) {
  return a > b
}

export function pad<T>(
  arr: T[],
  length: number,
  value: T,
  paddingStart: boolean = false
) {
  if (arr.length >= length) return arr

  const result = [...arr]

  for (let i = arr.length; i < length; i++) {
    if (paddingStart) result.unshift(value)
    else result.push(value)
  }

  return result
}

export function roundToNearest(value: number, interval: number) {
  return Math.round((value + interval / 2) / interval) * interval
}

export function formatNumber({
  value,
  decimals = 2,
  factor = 1e-8,
}: {
  value: number
  decimals?: number
  factor?: number
}) {
  return (value * factor).toFixed(decimals)
}

export function adjustNumber(value: string, factor: number = 1e8) {
  return Math.floor(factor * (parseFloat(value) + 0.5 / factor))
}
