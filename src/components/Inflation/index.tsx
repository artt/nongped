import React from 'react'
import ChartAndTable from 'components/ChartAndTable'
import { freqToNum, getTedDataPromise } from "utils"
import type { freqType, LabelDefType, TedDataType, TimeSeriesWithFrequenciesType } from "utils"
import { defaultOptions } from "components/HighchartsWrapper/common"

const labelDefs: LabelDefType = {
  cpi: {
    label: 'CPI',
    color: defaultOptions.colors[0],
  },
  cpi_core: {
    label: 'Core',
    color: defaultOptions.colors[1],
  },
  cpi_rawfood: {
    label: 'Raw Food',
    color: defaultOptions.colors[2],
  },
  cpi_energy: {
    label: 'Energy',
    color: defaultOptions.colors[3],
  },
}

const freqList = ["M", "Q", "Y"]

// https://www.price.moc.go.th/price/fileuploader/file_cpi/cpi_note_2562.pdf
// TODO: apply correct weights
// const weights15 = [100, 72.56, 15.69, 11.75]
const weights19 = [100, 67.06, 20.55, 12.39]

export default function Inflation() {

  const [rawData, setRawData] = React.useState<TimeSeriesWithFrequenciesType>()
  const dataLoaded = React.useRef(false)

  function processInflationData(data: TedDataType, freq: freqType) {
    const numFreq = freqToNum(freq)
    return(data.series.map((series: {name: string, values: number[]}, seriesIndex: number) => ({
      name: series.name,
      data: series.values.map((_, i: number, a: number[]) => ({
        t: data.periods[i],
        v: a[i],
        g: (a[i] / a[i - numFreq] - 1),
        c: (a[i] / a[i - numFreq] - 1) * weights19[seriesIndex] / 100,
      })),
    })))
  }

  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    const promises = []
    for (const freq of freqList) {
      promises.push(getTedDataPromise(["cpi", "cpi_core", "cpi_rawfood", "cpi_energy"], freq, 1986)
        .then(res => processInflationData(res, (freq as freqType)))
      )
    }
    Promise.all(promises).then(res => {
      setRawData({
        M: res[0],
        Q: res[1],
        Y: res[2],
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