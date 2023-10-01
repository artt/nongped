import { ProcessedSeriesDefinition, TedData, GdpData } from "types"
import { freqToNum, getSeriesIndex } from "utils"

export function processGdpData(tmp: TedData[], seriesDefs: ProcessedSeriesDefinition[], gdpSeriesToLoad: string[]) {
    
  const tedData = {
    Q: tmp[0],
    Y: tmp[1],
  }
  
  const gdeIndex = 1
  const gdeDeflator = tedData.Y.series[gdpSeriesToLoad.length + gdeIndex].values
  const gderYearly = tedData.Y.series[gdeIndex].values
  const gderQuarterly = tedData.Q.series[gdeIndex].values

  function processSeries(series: ProcessedSeriesDefinition, freq: "Q" | "Y") {
    const seriesIndex = getSeriesIndex(series.name, tedData[freq].series)
    if (seriesIndex !== -1) {
      // series exists in data
      const deflator = tedData.Y.series[seriesIndex + gdpSeriesToLoad.length].values
      const seriesYearly = tedData.Y.series[seriesIndex].values
      const negativeContribution = series.negativeContribution
      return({
        name: series.name,
        data: tedData[freq].series[seriesIndex].values.map((_, i: number, a: number[]) => {
          const yi = Math.floor(i / 4) // yearly index, used for quarterly data
          return({
            t: tedData[freq].periods[i],
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
        data: tedData[freq].periods.map(t => ({
          t,
          level: NaN,
          growth: NaN,
          contribution: NaN,
        })),
      })
    }
  }

  const processedData: GdpData = {
    Q: seriesDefs.map(series => processSeries(series, 'Q')),
    Y: seriesDefs.map(series => processSeries(series, 'Y')),
  }

  console.log(tedData.Y)

  // calculate series that need to be calculated
  // loop over Q, Y
  Object.values(processedData).forEach(processedData => {
    // deal with statr
    const statr = processedData[getSeriesIndex("statr", processedData)]
    const gdpr = processedData[getSeriesIndex("gdpr", processedData)]
    const gder = processedData[getSeriesIndex("gder", processedData)]
    statr.data.forEach((p, i) => {
      p.contribution = gdpr.data[i].contribution - gder.data[i].contribution
    });
    ['cr', 'ir', 'ddr', 'xr', 'mr', 'nxr'].forEach(seriesName => {
      const series = processedData[getSeriesIndex(seriesName, processedData)]
      const children = seriesDefs[getSeriesIndex(seriesName, seriesDefs)].children
      series.data.forEach((p, i) => {
        // const sumProduct = children.reduce((acc, cur) => {
        //   const childSeries = processedData[getSeriesIndex(cur, processedData)]
        //   return(acc + childSeries.data[i].level *(childSeries.data[i].deflator || 0))
        // }, 0)
        p.contribution = children.reduce((acc, cur) => acc + processedData[getSeriesIndex(cur, processedData)].data[i].contribution, 0)
      })
    })
  })
  return(processedData)
}