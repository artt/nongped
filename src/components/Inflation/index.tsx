import React from 'react'
import ChartAndTable from 'components/ChartAndTable'
import { freqDefs, freqToNum, getTedDataPromise } from "utils"
import type { freqType, TedDataType, TimeSeriesWithFrequenciesType } from "utils"

// https://www.price.moc.go.th/price/fileuploader/file_cpi/cpi_note_2562.pdf
// TODO: apply correct weights
// const weights15 = [100, 72.56, 15.69, 11.75]
const weights19 = [100, 67.06, 20.55, 12.39]

export default function Inflation() {

  const [rawData, setRawData] = React.useState<TimeSeriesWithFrequenciesType>()
  const dataLoaded = React.useRef(false)

  function processTedData(data: TedDataType, freq: freqType) {
    const numFreq = freqToNum(freq)
    return(data.series.map((series: {name: string, values: number[]}, seriesIndex: number) => ({
      name: series.name,
      data: series.values.map((p: number, i: number, a: number[]) => ({
        t: data.periods[i],
        v: p,
        g: (p / a[i - numFreq] - 1),
        c: (p / a[i - numFreq] - 1) * weights19[seriesIndex] / 100,
      })),
    })))
  }

  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    const promises = []
    for (const freq of Object.keys(freqDefs)) {
      promises.push(getTedDataPromise(["cpi", "cpi_core", "cpi_rawfood", "cpi_energy"], freq, 1986)
        .then(res => processTedData(res, (freq as freqType)))
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
    <ChartAndTable rawData={rawData} />
  )
}