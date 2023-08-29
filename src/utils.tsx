import { TooltipPoint, freqType } from "types"

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

export function freqToNum(freq: freqType) {
  return freqDefs[freq].num
}

export function freqToString(freq: freqType) {
  return freqDefs[freq].label
}

// convert from YYYYQ# to YYYY-MM
export function quarterToMonth(quarterString: string) {
  const year = quarterString.slice(0, 4)
  const quarter = quarterString.slice(-1)
  return `${year}-${parseInt(quarter) * 3 - 2}`
}

// convert from YYYY-MM to YYYYQ#
export function monthToQuarter(monthString: string) {
  const year = monthString.slice(0, 4)
  const month = parseInt(monthString.slice(-2))
  return `${year}Q${Math.ceil(month / 3)}`
}

// add thousands separator using toLocaleString
// also format large numbers, like 1000000 -> 1M, 1000000000 -> 1B, etc.
export function customLocaleString(n?: number) {
  if (n === undefined) return ""
  if (n < 1e3) return n.toLocaleString()
  if (n < 1e6) return `${(n / 1e3).toLocaleString()}k`
  if (n < 1e9) return `${(n / 1e6).toLocaleString()}M`
  return `${(n / 1e9).toLocaleString()}B`
}

// return month name, like 1 -> Jan, 2 -> Feb, etc.
export function getMonthName(month: number) {
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
}

export function ticksPercentFormatter(this: {value:number}, _o: object, dontMultiply = false): string {
  return `${(this.value * (dontMultiply ? 1 : 100)).toFixed(0)}%`
}
export function percentFormatterNumber(y: number, dontMultiply = false): string {
  return `${(y * (dontMultiply ? 1 : 100)).toFixed(2)}%`
}
export function percentFormatter(this: TooltipPoint, _o: object, dontMultiply = false): string {
  console.log(this)
  if (this.points !== undefined) {
    return this.points.map(point => `${point.series.name}: <b>${(point.y * (dontMultiply ? 1 : 100)).toFixed(2)}%</b>`).join('<br/>')
  }
  return percentFormatterNumber(this.y, dontMultiply)
}