export type Frequency = "M" | "Q" | "Y"
export type QuarterlyFrequency = "Q" | "Y"

export type GdpData = Record<QuarterlyFrequency, CalculatedSeries[]>

export type SeriesDefinition = {
  name: string,
  label: string,
  color?: string
  hide?: ContributionMode[],
  negativeContribution?: boolean,
  skipLoading?: boolean,
  children?: SeriesDefinition[],
  depth?: number,
}

export interface ProcessedSeriesDefinition extends SeriesWithName {
  name: string,
  label: string,
  color?: string
  hide?: ContributionMode[],
  negativeContribution?: boolean,
  skipLoading?: boolean,
  parent: string,
  children: string[],
  depth: number,
}

export interface TedDataSeries extends SeriesWithName {
  name: string,
  values: number[],
}

/**
 * Raw time series data from TED
 */
export type TedData = {
  periods: string[],
  series: TedDataSeries[],
}

export interface SeriesWithName {
  name: string,
}

/**
 * Calculated time series data
 */
export interface CalculatedSeries extends SeriesWithName {
  name: string,
  data: {
    t: string,
    levelReal: number,
    growth: number,
    contribution: number,
  }[],
}

export interface CalculatedSeriesWithDeflator extends CalculatedSeries {
  name: string,
  data: {
    t: string,
    levelReal: number,
    levelNominal: number,
    growth: number,
    contribution: number,
    deflator: number,
  }[],
}

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

export type ContributionMode = "levelReal" | "growth" | "contribution"

export type TedSeries = {
  name: string,
  data: {
    t: string,
    v: number,
  }[],
}
export type SeriesState = {
  [key: string]: {
    isExpanded?: boolean,
    isParentCollapsed?: boolean,
  }
}
export type ComponentChartData = {
  freq: Frequency,
  mode: ContributionMode,
  series: TedSeries[],
  chartSeries: {
    color?: string,
    zIndex: number,
    type: string,
  }[]
}
