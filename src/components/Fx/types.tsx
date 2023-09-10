export type NeerData = {
  periods: string[]
  returns: number[]
}

export type FxData = {
  ticks: number[],
  series: {
    name: string
    data: number[]
    yearlyReturns: number[]
    yearlyVolatility: number[]
  }[]
}
