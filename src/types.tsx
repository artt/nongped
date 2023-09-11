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

export type Series = {
  name: string,
  isExpanded?: boolean,
  data: {
    t: string,
    v: number,
  }[],
}
export type ComponentChartData = {
  freq: Frequency,
  mode: ContributionMode,
  pointStart: number,
  series: Series[]
  chartSeries: {
    name: string,
    color?: string,
    zIndex: number,
    type: string,
  }[]
}

