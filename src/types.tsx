export type freqType = "M" | "Q" | "Y"

export type LabelDefType = {
  [x: string]: {
    label: string,
    color?: string
    hideInGrowthChart?: boolean,
    hideInContributionChart?: boolean,
    negativeContribution?: boolean,
  }
}

export type TedDataType = {
  periods: string[],
  series: {
    name: string,
    values: number[],
  }[],
}

export type TimeSeriesDataType = {
  name: string,
  data: {
    t: string,
    v: number,
    g: number,
    c: number,
    deflator?: number,
  }[],
}[]

export type TimeSeriesWithFrequenciesType = {
  [x: string]: TimeSeriesDataType,
}

type SimpleSeriesType = {
  name: string,
  data: {
    t: string,
    v: number,
  }[],
}

export type ProcessedDataType = {
  freq: freqType,
  series: SimpleSeriesType[],
}

export type Point = {
  series: {name: string},
  y: number,
}
export type TooltipPoint = {
  x: number,
  y: number,
  point?: Point,
  points?: Point[],
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

export type NeerData = {
  periods: string[]
  returns: number[]
}

export type ComponentChartDataType = {
  freq: freqType,
  showGrowth: boolean,
  showContribution: boolean,
  tableSeries: SimpleSeriesType[]
  chartSeries: {
    name: string,
    color?: string,
    zIndex: number,
    data: number[],
    type: string,
    pointStart: number,
    pointIntervalUnit: string,
    pointInterval: number,
  }[]
}