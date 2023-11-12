import { TooltipPoint, Frequency, SeriesDefinition, ProcessedSeriesDefinition, SeriesState, SeriesWithName } from "types"
import Color from "color"

// export const serverAddress = process.env.NODE_ENV === "development"
//   ? `http://localhost:1443`
//   : `https://nongped.api.artt.dev`

// export const serverAddress = "http://localhost:1443"
export const serverAddress = "https://ted.api.artt.dev"

export const curYear = new Date().getFullYear()

export async function getTedDataPromise(series: string[], freq: string, start_period: string | number) {
  return fetch(`${serverAddress}/ted`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      series: series,
      freq: freq,
      start_period: start_period,
    })
  })
    .then(res => res.json())
}

export const freqDefs = {
  M: {
    label: "month",
    num: 12,
  },
  Q: {
    label: "quarter",
    num: 4,
  },
  Y: {
    label: "year",
    num: 1,
  },
}

export function freqToNum(freq: Frequency) {
  return freqDefs[freq].num
}

export function freqToString(freq: Frequency) {
  return freqDefs[freq].label
}

/**
 * Convert from YYYYQ# to YYYY-MM
 */
export function quarterToMonth(quarterString: string): string {
  const year = quarterString.slice(0, 4)
  const quarter = quarterString.slice(-1)
  return `${year}-${parseInt(quarter) * 3 - 2}`
}

/**
 * Convert from YYYY-MM to YYYYQ#
 */
export function monthToQuarter(monthString: string): string {
  const year = monthString.slice(0, 4)
  const month = parseInt(monthString.slice(-2))
  return `${year}Q${Math.ceil(month / 3)}`
}

/**
 * Add thousands separator using toLocaleString.
 * Also format large numbers, like 1000000 → 1M, 1000000000 → 1B, etc.
 */
export function customLocaleString(n?: number): string {
  if (n === undefined) return ""
  if (n < 1e3) return n.toLocaleString()
  if (n < 1e6) return `${(n / 1e3).toLocaleString()}k`
  if (n < 1e9) return `${(n / 1e6).toLocaleString()}M`
  return `${(n / 1e9).toLocaleString()}B`
}

/**
 * Return month name from number; 1 → Jan, 2 → Feb, etc.
 */
export function getMonthName(month: number): string {
  return new Date(0, month - 1).toLocaleString('en-US', { month: 'short' })
}

export const defaultOptions = {
  colors: [
    '#3f708c',
    '#f7af1c',
    '#2ca02c',  // cooked asparagus green
    '#d62728',  // brick red
    '#9467bd',  // muted purple
    '#8c564b',  // chestnut brown
    '#e377c2',  // raspberry yogurt pink
    '#7f7f7f',  // middle gray
    '#bcbd22',  // curry yellow-green
    '#17becf',  // blue-teal
  ],
  title: {
    text: "",
  },
  credits: {
    enabled: false,
  },
  plotOptions: {
    series: {
      lineWidth: 2,
    },
  },
  chart: {
    backgroundColor: 'transparent',
  },
  rangeSelector: {
    buttons: [
      {
        type: 'ytd',
        text: 'YTD',
      },
      {
        type: 'year',
        count: 1,
        text: '1Y',
      },
      {
        type: 'year',
        count: 3,
        text: '3Y',
      },
      {
        type: 'year',
        count: 5,
        text: '5Y',
      },
      {
        type: 'year',
        count: 10,
        text: '10Y',
      },
      {
        type: 'all',
        text: 'All',
      },
    ],
  },
  // TODO: remove this when we're ready
  accessibility: {
    enabled: false,
  },
}

/**
 * A formatter for Highcharts ticks without decimal points
 */
export function ticksPercentFormatter(this: { value: number }, _o: object, dontMultiply=false): string {
  return `${(this.value * (dontMultiply ? 1 : 100)).toFixed(0)}%`
}

/**
 * Convert percentage decimals to percentage string with 2 decimals
 */
export function percentFormatterNumber(y: number, dontMultiply=false): string {
  return `${(y * (dontMultiply ? 1 : 100)).toFixed(2)}%`
}

/**
 * Convert ticks to nicely formatted date string
 */
export function ticksDateFormatter(tick: number, freq: Frequency): string {
  const date = new Date(tick)
  const iso = date.toISOString().slice(0, 7)
  switch (freq) {
    case "M": return date.toLocaleString('default', { month: 'short', year: 'numeric' })
    case "Q": return monthToQuarter(iso)
    case "Y": return iso.slice(0, 4)

  }
  // return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
}

function formatPercentLine(str: string, y: number) {
  return str.replace(/<b>.*<\/b>/, `<b>${percentFormatterNumber(y)}</b>`)
}

export function tooltipPercentFormatter(tooltipPoint: TooltipPoint, tooltip: Highcharts.Tooltip, freq: Frequency) {
  const tmp = tooltip.defaultFormatter.call(tooltipPoint, tooltip)
  if (typeof tmp === "string") return tmp
  return tmp.map((line: string, i: number) => {
    if (line === "") return line
    if (i === 0) return ticksDateFormatter(tooltipPoint.x, freq) + "<br>"
    if (!tooltipPoint.points) return formatPercentLine(line, tooltipPoint.y)
    return formatPercentLine(line, tooltipPoint.points[i - 1].y)
  })
}

export function dataLabelsPercentFormatter(this: TooltipPoint) {
  return percentFormatterNumber(this.y)
}

export function getSeries<T>(name: string | number, seriesArray: T[]): T {
  const seriesIndex = (seriesArray as SeriesWithName[]).findIndex(series => series.name === name)
  return seriesArray[seriesIndex]
}

// TODO: simplify this if we're set on using this structure?
export function getAllSeriesNames(allSeries: ProcessedSeriesDefinition[], filterFunction: ((series: ProcessedSeriesDefinition) => boolean) = () => true): string[] {
  const res: string[] = []
  allSeries.forEach(series => {
    if (filterFunction(series)) {
      res.push(series.name)
    }
  })
  return res
}

/**
 * Convert array of SeriesDefinition into an object, with added parents and depth
 * @param allSeries 
 * @param initialDepth 
 */
export function processSeriesDefinition(allSeries: SeriesDefinition[], initialDepth=0, parent="root"): ProcessedSeriesDefinition[] {
  const out: ProcessedSeriesDefinition[] = []
  allSeries.forEach(series => {
    out.push({
      ...series,
      parent: parent,
      children: series.children ? series.children.map(child => child.name) : [],
      depth: initialDepth,
    })
    if (series.children) {
      out.push(...processSeriesDefinition(series.children, initialDepth + 1, series.name))
    }
  })
  return out
}

export function calculateColor(allSeries: ProcessedSeriesDefinition[]) {
  for (let i = 0; i < allSeries.length; i ++) {
    const series = allSeries[i]
    if (series.color) continue
    series.color = calculateSeriesColor(allSeries, i)
  }
}

function calculateSeriesColor(allSeries: ProcessedSeriesDefinition[], seriesIndex: number): string {
  const series = allSeries[seriesIndex]
  if (series.color) return series.color
  if (series.children) {
    const childrenColors: string[] = series.children.map(child => {
      const childIndex = allSeries.findIndex(s => s.name === child)
      return calculateSeriesColor(allSeries, childIndex)
    })
    return blend(childrenColors)
  }
  return ""
}

function blend(colors: string[]): string {
  let color = Color(colors[0])
  for (let i = 1; i < colors.length; i ++) {
    color = color.mix(Color(colors[i]), 1/colors.length)
  }
  return color.hex()
}

export function isAnyParentCollapsed(name: string, seriesState: SeriesState, seriesDefs: ProcessedSeriesDefinition[]): boolean {
  if (seriesState[name]?.isParentCollapsed) return true
  const seriesParent = getSeries(name, seriesDefs).parent
  if (seriesParent === "root") return false
  if (seriesState[seriesParent]?.isParentCollapsed) return true
  return isAnyParentCollapsed(seriesParent, seriesState, seriesDefs)
}

/**
 * Get all children of a series whose skipLoading is false
 * If the children skips loading, then get its children instead
 */
export function getRawChildren(name: string, seriesDefs: ProcessedSeriesDefinition[]): string[] {
  const series = getSeries(name, seriesDefs)
  if (!series.children) return []
  const children: string[] = []
  series.children.forEach(child => {
    if (getSeries(child, seriesDefs).skipLoading) {
      children.push(...getRawChildren(child, seriesDefs))
    } else {
      children.push(child)
    }
  })
  return children
}

export function sum(array: number[]): number {
  return array.reduce((a, b) => a + b, 0)
}

export function average(array: number[]): number {
  return sum(array) / array.length
}