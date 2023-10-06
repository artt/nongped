import { ProcessedSeriesDefinition, TedData, GdpData } from "types"
import { freqToNum, getSeries } from "utils"

export function processGdpData(tmp: TedData[], seriesDefs: ProcessedSeriesDefinition[], gdpSeriesToLoad: string[]) {
    
  const tedData = {
    Q: tmp[0],
    Y: tmp[1],
  }
  
  const gderYearly = getSeries("gder", tedData.Y.series).values
  const gdenYearly = getSeries("gden", tedData.Y.series).values
  const gderQuarterly = getSeries("gder", tedData.Q.series).values
  const gdeDeflator = gdenYearly.map((n, i) => n / gderYearly[i])

  function processSeries(series: ProcessedSeriesDefinition, freq: "Q" | "Y") {
    if (gdpSeriesToLoad.includes(series.name)) {
      // series exists in data
      const real = getSeries(series.name + "r", tedData[freq].series).values
      const nominal = getSeries(series.name + "n", tedData[freq].series).values
      const deflator = nominal.map((n, i) => n / real[i])
      let yearlyDeflator: number[] = []
      if (freq === "Q") {
        yearlyDeflator = getSeries(series.name, processedYearlyData).data.map(p => p.deflator)
      }
      const seriesYearly = getSeries(series.name + "r", tedData.Y.series).values
      const negativeContribution = series.negativeContribution
      return({
        name: series.name,
        data: real.map((_, i: number, a: number[]) => {
          const yi = Math.floor(i / 4) // yearly index, used for quarterly data
          return({
            t: tedData[freq].periods[i],
            levelReal: (negativeContribution ? -1 : 1) * a[i],
            levelNominal: (negativeContribution ? -1 : 1) * nominal[i],
            growth: (a[i] / a[i - freqToNum(freq)] - 1),
            contribution: (freq === "Q" && yi < 2)
              ? NaN
              : (series.name === "gdp" || series.name === "gde")
                ? (a[i] / a[i - freqToNum(freq)] - 1) // for gdp and gde, contribution is just growth
                : (freq === "Y")
                  ? (negativeContribution ? -1 : 1) * ((a[i] - a[i - 1]) / gderYearly[i - 1] * (deflator[i - 1] / gdeDeflator[i - 1]))
                  : (negativeContribution ? -1 : 1) * (((a[i] - a[i - 4]) / gderQuarterly[i - 4] * yearlyDeflator[yi - 1] / gdeDeflator[yi - 1]) + (a[i - 4] / gderQuarterly[i - 4] - seriesYearly[yi - 1] / gderYearly[yi - 1]) * (yearlyDeflator[yi - 1] / gdeDeflator[yi - 1] - yearlyDeflator[yi - 2] / gdeDeflator[yi - 2])),
            deflator: deflator[i],
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
          levelReal: NaN,
          levelNominal: NaN,
          growth: NaN,
          contribution: NaN,
          deflator: NaN,
        })),
      })
    }
  }

  const processedYearlyData = seriesDefs.map(series => processSeries(series, 'Y'))
  const processedQuarterlyData = seriesDefs.map(series => processSeries(series, 'Q'))

  const processedDataWithFrequencies: GdpData = {
    Q: processedQuarterlyData,
    Y: processedYearlyData,
  }

  // calculate series that need to be calculated
  // loop over Q, Y
  Object.values(processedDataWithFrequencies).forEach(processedData => {
    // deal with statr
    const stat = getSeries("stat", processedData)
    const gdp = getSeries("gdp", processedData)
    const gde = getSeries("gde", processedData)
    stat.data.forEach((p, i) => {
      p.contribution = gdp.data[i].contribution - gde.data[i].contribution
    });
    // other aggregated series
    ['c', 'i', 'dd', 'x', 'm', 'nx'].forEach(seriesName => {
      const series = getSeries(seriesName, processedData)
      const children = getSeries(seriesName, seriesDefs).children
      series.data.forEach((p, i) => {
        // const yi = Math.floor(i / 4) // yearly index, used for quarterly data
        // const sumProduct = children.reduce((acc, childName) => {
        //   const childSeries = getSeries(childName, processedData)
        //   const childDeflator = getSeries(getDeflatorName(childName), tedData.Y.series).values
        //   return acc + childSeries.data[i].levelReal * (childDeflator[yi - 1] || 0)
        // }, 0)
        p.contribution = children.reduce((acc, cur) => acc + getSeries(cur, processedData).data[i].contribution, 0)
        // p.levelReal = sumProduct
      })
    })
  })
  return(processedDataWithFrequencies)
}