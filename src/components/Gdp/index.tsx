import React from 'react'
import ChartAndTable from 'components/ChartAndTable'
import { freqToNum, getTedDataPromise } from "utils"
import type { freqType, LabelDefType, TedDataType, TimeSeriesWithFrequenciesType } from "utils"
import { defaultOptions } from "components/HighchartsWrapper/common"

const freqList = ["Q", "Y"]

const labelDefs: LabelDefType = {
  gdpr: {
    label: 'GDP',
    color: defaultOptions.colors[0],
  },
  cpr: {
    label: 'Private Consumption',
    color: defaultOptions.colors[1],
  },
}

export default function Gdp() {

  const [rawData, setRawData] = React.useState<TimeSeriesWithFrequenciesType>()
  const dataLoaded = React.useRef(false)

  function processGdpData(data: TedDataType, freq: freqType) {
    const numFreq = freqToNum(freq)
    return(data.series.map((series: {name: string, values: number[]}) => ({
    // return(data.series.map((series: {name: string, values: number[]}, seriesIndex: number) => ({
      name: series.name,
      data: series.values.map((p: number, i: number, a: number[]) => ({
        t: data.periods[i],
        v: p,
        g: (p / a[i - numFreq] - 1),
        c: (p / a[i - numFreq] - 1),
        // c: (p / a[i - numFreq] - 1) * weights19[seriesIndex] / 100,
      })),
    })))
  }

  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    const promises = []
    for (const freq of freqList) {
      promises.push(getTedDataPromise(["gdpr", "cpr"], freq, 1993)
        .then(res => processGdpData(res, (freq as freqType)))
      )
    }
    Promise.all(promises).then(res => {
      setRawData({
        Q: res[0],
        Y: res[1],
      })
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