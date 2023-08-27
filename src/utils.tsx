// export const serverAddress = process.env.NODE_ENV === "development"
//   ? `http://localhost:1443`
//   : `https://nongped.api.artt.dev`

// export const serverAddress = "http://localhost:1443"
export const serverAddress = "https://ted.api.artt.dev"

export const curYear = new Date().getFullYear()

export type freqType = "M" | "Q" | "Y"

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
  }[],
}[]

export type TimeSeriesWithFrequenciesType = {
  M: TimeSeriesDataType,
  Q: TimeSeriesDataType,
  Y: TimeSeriesDataType,
}


export function getTedDataPromise(series: string[], freq: string, start_period: string | number) {
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