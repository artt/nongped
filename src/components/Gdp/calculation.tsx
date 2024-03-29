import { ProcessedSeriesDefinition, TedData, GdpData, CalculatedSeriesWithDeflator, Frequency } from "types"
import { freqToNum, getSeries, sum, getRawChildren } from "utils"

function getIndex(year: number, q?: number) {
  if (q === undefined) return year - 1993
  return (year - 1993) * 4 + q - 1
}

export function processGdpData(tmp: TedData[], seriesDefs: ProcessedSeriesDefinition[], gdpSeriesToLoad: string[]) {
  
  const calculatedSeries = ['c', 'i', 'dd', 'x', 'm', 'nx']

  const tedData = {
    Q: tmp[0],
    Y: tmp[1],
  }
  
  const gderYearly = getSeries("gder", tedData.Y.series).values
  const gdenYearly = getSeries("gden", tedData.Y.series).values
  const gderQuarterly = getSeries("gder", tedData.Q.series).values
  const gdeDeflator = gdenYearly.map((n, i) => n / gderYearly[i])

  function processSeries(series: ProcessedSeriesDefinition, freq: "Q" | "Y"): CalculatedSeriesWithDeflator {
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
  const processedQuarterlyData = seriesDefs.map(series => processSeries(series, 'Q'));

  // add statr to both yearly and quarterly data
  // also add contribution and levelNominal to aggregated data
  [processedYearlyData, processedQuarterlyData].forEach((d, i) => {
    const gde = getSeries("gde", d)
    // recalculate stock contribution
    getSeries("stock", d).data.forEach((p, i) => {
      p.contribution = gde.data[i].contribution - sum(['cp', 'cgov', 'ip', 'ipub', 'xg', 'xs', 'mg', 'ms'].map(seriesName => getSeries(seriesName, d).data[i].contribution))
    })
    // stat contribution
    const gdp = getSeries("gdp", d)
    getSeries("stat", d).data.forEach((p, i) => {
      p.contribution = gdp.data[i].contribution - gde.data[i].contribution
    })
    calculatedSeries.forEach(seriesName => {
      const series = getSeries(seriesName, d)
      const children = getSeries(seriesName, seriesDefs).children
      series.data.forEach((p, i) => {
        p.contribution = sum(children.map(childName => getSeries(childName, d).data[i].contribution))
        p.levelNominal = sum(children.map(childName => getSeries(childName, d).data[i].levelNominal))
      })
      // set levelReal = levelNominal when year = 2002
      if (i === 0) {
        series.data[getIndex(2002)].levelReal = series.data[getIndex(2002)].levelNominal
        series.data[getIndex(2002)].deflator = 1
      }
    })
  })

  // loop over each calculated series
  calculatedSeries.forEach(seriesName => {

    // separate process for NX
    if (seriesName === 'nx') {
      // NX = X - M
      ["Q", "Y"].forEach(freq => {
        const data = freq === "Q" ? processedQuarterlyData : processedYearlyData
        const series = getSeries(seriesName, data)
        const xSeries = getSeries('x', data)
        const mSeries = getSeries('m', data)
        series.data.forEach((p, i) => {
          p.levelReal = xSeries.data[i].levelReal + mSeries.data[i].levelReal
          p.levelNominal = xSeries.data[i].levelNominal + mSeries.data[i].levelNominal
          p.contribution = xSeries.data[i].contribution + mSeries.data[i].contribution
          p.deflator = p.levelNominal / p.levelReal
        })
        // calculate growth
        for (let i = 0; i < series.data.length; i ++) {
          series.data[i].growth = series.data[i].levelReal / series.data[i - freqToNum(freq as Frequency)]?.levelReal - 1
        }
      })
      return
    }

    const seriesQuarterly = getSeries(seriesName, processedQuarterlyData)
    const seriesYearly = getSeries(seriesName, processedYearlyData)
    const children = getRawChildren(seriesName, seriesDefs)

    // precalculate sumproduct for all quarters
    const sumProduct = Array(seriesQuarterly.data.length).fill(NaN)
    for (let i = 0; i < seriesQuarterly.data.length; i ++) {
      const yi = Math.floor(i / 4)
      sumProduct[i] = children.reduce((acc, childName) => {
        // const childSeriesNegativeContribution = getSeries(childName, seriesDefs).negativeContribution
        const childSeriesQuarterly = getSeries(childName, processedQuarterlyData)
        const childSeriesYearly = getSeries(childName, processedYearlyData)
        return acc + childSeriesQuarterly.data[i].levelReal * childSeriesYearly.data[yi - 1]?.deflator
      }, 0)
    }

    // first go from 2003q1 up to now
    // calculate levelReal for each quarter
    // once we get the whole year, calculate levelReal for the year as sum of quarterly real levels
    // then calculate deflator for the year
    for (let i = getIndex(2003, 1); i < seriesQuarterly.data.length; i ++) {
      const yi = Math.floor(i / 4)
      seriesQuarterly.data[i].levelReal = sumProduct[i] / seriesYearly.data[yi - 1].deflator
      if (i % 4 === 3) {
        // we get the whole year, so now we can calculate deflator for the year
        seriesYearly.data[yi].levelReal = sum(seriesQuarterly.data.slice(i - 3, i + 1).map(p => p.levelReal))
        seriesYearly.data[yi].deflator = seriesYearly.data[yi].levelNominal / seriesYearly.data[yi].levelReal
      }
    }

    // now go back from 2002q4 to 1994q1
    for (let y = 2002; y > 1993; y --) {
      // we know deflator for year i
      // so we need to find yearly deflator for year i-1 such that deflator = yearly levelNominal / sum of quarterly levelReal
      const yi = y - 1993
      // quarterly real = sumProduct[getIndex(i, 1)] / deflator(yi - 1)
      // yearly real = q1 + q2 + q3 + q4 = (sumProduct[getIndex(i, 1)] + sumProduct[getIndex(i, 2)] + sumProduct[getIndex(i, 3)] + sumProduct[getIndex(i, 4)]) / initialGuess
      // deflator(t) = nominal(t) / real(t)
      //  = seriesYearly.data[yi].levelNominal / ((sumProduct[getIndex(i, 1)] + sumProduct[getIndex(i, 2)] + sumProduct[getIndex(i, 3)] + sumProduct[getIndex(i, 4)]) / initialGuess)
      //  = seriesYearly.data[yi].levelNominal * initialGuess / (sumProduct[getIndex(i, 1)] + sumProduct[getIndex(i, 2)] + sumProduct[getIndex(i, 3)] + sumProduct[getIndex(i, 4)])
      // deflator = nominal * initialGuess / sum
      // initialGuess = deflator * sum / nominal
      const tmp = sumProduct.slice(getIndex(y, 1), getIndex(y, 4) + 1)
      const sumTmp = sum(tmp)
      seriesYearly.data[yi - 1].deflator = seriesYearly.data[yi].deflator * sumTmp / seriesYearly.data[yi].levelNominal
      for (let q = 1; q <= 4; q ++) {
        seriesQuarterly.data[getIndex(y, q)].levelReal = tmp[q - 1] / seriesYearly.data[yi - 1].deflator
      }
      seriesYearly.data[yi].levelReal = sumTmp / seriesYearly.data[yi - 1].deflator
    }

    // then we calculate growth for each quarter and each year
    for (let i = 0; i < seriesQuarterly.data.length; i ++) {
      seriesQuarterly.data[i].growth = seriesQuarterly.data[i].levelReal / seriesQuarterly.data[i - 4]?.levelReal - 1
    }
    for (let i = 0; i < seriesYearly.data.length; i ++) {
      seriesYearly.data[i].growth = seriesYearly.data[i].levelReal / seriesYearly.data[i - 1]?.levelReal - 1
    }

  })

  // calculate quarterly real levels for aggregated series

  console.log(processedQuarterlyData)
  console.log(processedYearlyData)


  const processedDataWithFrequencies: GdpData = {
    Q: processedQuarterlyData,
    Y: processedYearlyData,
  }

  return(processedDataWithFrequencies)
}