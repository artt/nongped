export type Frequency = "M" | "Q" | "Y"

export type SeriesDefinition = {
  name: string,
  label: string,
  color?: string
  hide?: ContributionMode[],
  negativeContribution?: boolean,
  skipLoading?: boolean,
  children?: SeriesDefinition[],
}

/**
 * Raw time series data from TED
 */
export type TedData = {
  periods: string[],
  series: {
    name: string,
    values: number[],
  }[],
}

/**
 * Processed time series data
 */
export type ProcessedData = {
  name: string,
  data: {
    t: string,
    level: number,
    growth: number,
    contribution: number,
    deflator?: number,
  }[],
}[]

export type Point = {
  series: { name: string },
  y: number,
}
export type TooltipPoint = {
  x: number,
  y: number,
  point?: Point,
  points?: Point[],
}

export type ContributionMode = "level" | "growth" | "contribution"

type SimpleSeriesType = {
  name: string,
  data: {
    t: string,
    v: number,
  }[],
}
export type ComponentChartDataType = {
  freq: Frequency,
  mode: ContributionMode,
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

