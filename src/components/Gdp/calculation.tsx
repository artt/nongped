import { ProcessedSeriesDefinition, TedData } from "types"
import { freqToNum, getSeriesIndex } from "utils"

export function processGdpData(tmp: TedData[], seriesDefs: ProcessedSeriesDefinition[], gdpSeriesToLoad: string[]) {
    
  const data = {
    Q: tmp[0],
    Y: tmp[1],
  }
  
  const gdeIndex = 1
  const gdeDeflator = data.Y.series[gdpSeriesToLoad.length + gdeIndex].values
  const gderYearly = data.Y.series[gdeIndex].values
  const gderQuarterly = data.Q.series[gdeIndex].values

  function processSeries(series: ProcessedSeriesDefinition, freq: "Q" | "Y") {
    const seriesIndex = getSeriesIndex(series.name, data[freq].series)
    if (seriesIndex !== -1) {
      // series exists in data
      const deflator = data.Y.series[seriesIndex + gdpSeriesToLoad.length].values
      const seriesYearly = data.Y.series[seriesIndex].values
      const negativeContribution = series.negativeContribution
      return({
        name: series.name,
        data: data[freq].series[seriesIndex].values.map((_, i: number, a: number[]) => {
          const yi = Math.floor(i / 4) // yearly index, used for quarterly data
          return({
            t: data[freq].periods[i],
            level: (negativeContribution ? -1 : 1) * a[i],
            growth: (a[i] / a[i - freqToNum(freq)] - 1),
            contribution: (freq === "Q" && yi < 2)
              ? NaN
              : (series.name === "gdpr" || series.name === "gder")
                ? (a[i] / a[i - freqToNum(freq)] - 1) // for gdp and gde, contribution is just growth
                : (freq === "Y")
                  ? (negativeContribution ? -1 : 1) * ((a[i] - a[i - 1]) / gderYearly[i - 1] * (deflator[i - 1] / gdeDeflator[i - 1]))
                  : (negativeContribution ? -1 : 1) * (((a[i] - a[i - 4]) / gderQuarterly[i - 4] * deflator[yi - 1] / gdeDeflator[yi - 1]) + (a[i - 4] / gderQuarterly[i - 4] - seriesYearly[yi - 1] / gderYearly[yi - 1]) * (deflator[yi - 1] / gdeDeflator[yi - 1] - deflator[yi - 2] / gdeDeflator[yi - 2]))
          })
        }),
      })
    }
    else {
      // series needs to be calculated
      // return series with data filled with t: dates, and others NaN
      // these will be filled in later
      return({
        name: series.name,
        data: data[freq].periods.map(t => ({
          t,
          level: NaN,
          growth: NaN,
          contribution: NaN,
        })),
      })
    }
  }

  const processedQuarterlyData = seriesDefs.map(series => processSeries(series, 'Q'))
  const processedYearlyData = seriesDefs.map(series => processSeries(series, 'Y'))

  // calculate series that need to be calculated
  

  return({
    Q: processedQuarterlyData,
    Y: processedYearlyData,
  })
}