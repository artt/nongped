import React from 'react'
import ChartAndTable from 'components/ChartAndTable'
import { freqToNum, getTedDataPromise } from "utils"
import type { freqType, LabelDefType, TedDataType, TimeSeriesWithFrequenciesType } from "utils"
import { defaultOptions } from "components/HighchartsWrapper/common"

const freqList = ["Q", "Y"]

const gdpSeries = ["gdpr", "gder", "cpr"]

const labelDefs: LabelDefType = {
  gdpr: {
    label: 'GDP',
    color: defaultOptions.colors[0],
  },
  gder: {
    label: 'GDE',
    color: defaultOptions.colors[1],
  },
  cpr: {
    label: 'Private Consumption',
    color: defaultOptions.colors[2],
  },
}

export default function Gdp() {

  const [rawData, setRawData] = React.useState<TimeSeriesWithFrequenciesType>()
  const dataLoaded = React.useRef(false)

  // convert string *r to *_deflator
  function getDeflatorName(xr: string) {
    return xr.slice(0, -1) + "_deflator"
  }

  function processGdpData(tmp: TedDataType[]) {
    
    const data = {
      Q: tmp[0],
      Y: tmp[1],
    }
    
    const gdeIndex = 1
    const gdeDeflator = data.Y.series[gdpSeries.length + gdeIndex].values
    const gderYearly = data.Y.series[gdeIndex].values
    const gderQuarterly = data.Q.series[gdeIndex].values

    const processedYearlyData = data.Y.series.slice(0, gdpSeries.length).map((series: {name: string, values: number[]}, seriesIndex: number) => {
      const deflator = data.Y.series[seriesIndex + gdpSeries.length].values
      return({
        name: series.name,
        data: series.values.map((_, i: number, a: number[]) => ({
          t: data.Y.periods[i],
          v: a[i],
          g: (a[i] / a[i - 1] - 1),
          c: seriesIndex < 2 ? (a[i] / a[i - 1] - 1) : ((a[i] - a[i - 1]) / gderYearly[i - 1] * (deflator[i - 1] / gdeDeflator[i - 1])),
        })),
      })
    })

    const processedQuarterlyData = data.Q.series.map((series: {name: string, values: number[]}, seriesIndex: number) => {
      // we only use yearly deflator, so this Y is not a typo
      const deflator = data.Y.series[seriesIndex + gdpSeries.length].values
      const seriesYearly = data.Y.series[seriesIndex].values
      return({
        name: series.name,
        data: series.values.map((_, i: number, a: number[]) => {
          const yi = Math.floor(i / 4) // yearly index
          return({
            t: data.Q.periods[i],
            v: a[i],
            g: (a[i] / a[i - 4] - 1),
            c: yi < 2 ? NaN : (((a[i] - a[i - 4]) / gderQuarterly[i - 4] * deflator[yi - 1] / gdeDeflator[yi - 1]) + (a[i - 4] / gderQuarterly[i - 4] - seriesYearly[yi - 1] / gderYearly[yi - 1]) * (deflator[yi - 1] / gdeDeflator[yi - 1] - deflator[yi - 2] / gdeDeflator[yi - 2])),
          })
        }),
      })
    })

    console.log(processedQuarterlyData)

    return({
      Q: processedQuarterlyData,
      Y: processedYearlyData,
    })
  }

  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    const deflatorSeries = gdpSeries.map(getDeflatorName)
    const promises = []
    for (const freq of freqList) {
      // for quarterly data, just get the *r
      // for yearly data, get deflators as well
      promises.push(getTedDataPromise(freq === "Q" ? gdpSeries : gdpSeries.concat(deflatorSeries), freq, 1993)
        // .then(res => processGdpData(res, (freq as freqType)))
      )
    }
    Promise.all(promises).then(res => {
      setRawData(processGdpData(res))
    })
  }, [])

  return(
    <ChartAndTable
      freqList={freqList}
      labelDefs={labelDefs}
      rawData={rawData}
    />
  )
}