import React from 'react'
import { freqToNum, getAllSeriesNames, getSeries, getTedDataPromise, processSeriesDefinition } from "utils"
import type { SeriesDefinition, TedData, CalculatedSeries, ComponentChartData, ContributionMode, SeriesState } from "types"
import Split from "components/Split"
import ComponentChart from "components/ComponentChart"
import SummaryTable from "components/SummaryTable"
import Box from "@mui/material/Box"
import useMediaQuery from '@mui/material/useMediaQuery';
import TimeSeriesController from "components/TimeSeriesController"

const inputDefs: SeriesDefinition[] = [
  {
    name: 'cpi',
    label: 'CPI',
    children: [
      {
        name: 'cpi_core',
        label: 'Core',
      },
      {
        name: 'cpi_rawfood',
        label: 'Raw Food',
      },
      {
        name: 'cpi_energy',
        label: 'Energy',
      },
    ],
  },
]
const seriesDefs = processSeriesDefinition(inputDefs)

const freqList = ["M", "Q", "Y"]

// https://www.price.moc.go.th/price/fileuploader/file_cpi/cpi_note_2562.pdf
// TODO: apply correct weights
// const weights15 = [100, 72.56, 15.69, 11.75]
const weights19 = [100, 67.06, 20.55, 12.39]

type InflationData = {
  M: CalculatedSeries[],
  Q: CalculatedSeries[],
  Y: CalculatedSeries[],
}

type Frequency = keyof InflationData

export default function Inflation() {

  const wideScreen = useMediaQuery('(min-width:600px)');
  const tallScreen = useMediaQuery('(min-height:600px)');

  const [processedData, setProcessedData] = React.useState<InflationData>()
  const dataLoaded = React.useRef(false)

  const [data, setData] = React.useState<ComponentChartData>()
  const [freq, setFreq] = React.useState<Frequency>((freqList[0] as Frequency))
  const [showGrowth, setShowGrowth] = React.useState(true)
  const [showContribution, setShowContribution] = React.useState(true)
  const [mode, setMode] = React.useState<ContributionMode>("contribution")
  const [minDate, setMinDate] = React.useState<string>()
  const [maxDate, setMaxDate] = React.useState<string>()
  const [seriesState, setSeriesState] = React.useState<SeriesState>({})

  const handleRangeChange = React.useCallback((minDate: string, maxDate: string) => {
    setMinDate(minDate)
    setMaxDate(maxDate)
  }, [])

  function processInflationData(data: TedData, freq: Frequency) {
    console.log(data)
    const numFreq = freqToNum(freq)
    return(data.series.map((series: {name: string, values: number[]}, seriesIndex: number) => ({
      name: series.name,
      data: series.values.map((_, i: number, a: number[]) => ({
        t: data.periods[i],
        levelReal: a[i],
        growth: (a[i] / a[i - numFreq] - 1),
        contribution: (a[i] / a[i - numFreq] - 1) * weights19[seriesIndex] / 100,
      })),
    })))
  }

  // load data upon first render
  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    // TODO: can process each frequency separately and not have to wait for all to finish
    const promises = []
    const allSeriesNames = getAllSeriesNames(seriesDefs)
    for (const freq of freqList) {
      promises.push(getTedDataPromise(allSeriesNames, freq, 1986)
        .then(res => processInflationData(res, (freq as Frequency)))
      )
    }
    Promise.all(promises).then(res => {
      setProcessedData({
        M: res[0],
        Q: res[1],
        Y: res[2],
      })
    })
    // set initial states for series
    setSeriesState(allSeriesNames.reduce((acc, name) => {
      acc[name] = {
        isExpanded: true,
        isParentCollapsed: false,
      }
      return acc
    }, {} as SeriesState))
  }, [])

  React.useEffect(() => {
    if (!showGrowth) {
      setMode("levelReal")
    }
    else if (!showContribution) {
      setMode("growth")
    }
    else {
      setMode("contribution")
    }
  }, [showGrowth, showContribution])

  React.useEffect(() => {
    if (!processedData) return
    const series = processedData[freq].map(s => ({
      name: s.name,
      // data: s.data.slice(mode === "levelReal" ? 0 : freqToNum(freq)).map(d => ({
      data: s.data.map(d => ({
        t: d.t,
        v: d[mode],
      })),
    }))
    const chartSeries = series
      .map((s, i) => ({
        color: getSeries(s.name, seriesDefs).color,
        findNearestPointBy: i === 0 ? 'x' : 'xy',
        zIndex: i === 0 ? 99 : i,
        // in contribution mode, only the first series is a line chart
        type: mode === "contribution" && i > 0 ? 'column' : 'spline',
      }))
    setData({freq, mode, series, chartSeries})
  }, [processedData, freq, mode])

  function Top() {
    return (
      <Box sx={{
        display: "flex",
        width: '100%',
        gap: 4,
        flexDirection: {xs: 'column', sm: 'row'},
      }}>
        <TimeSeriesController
          freqList={freqList}
          freq={freq}
          setFreq={setFreq}
          showGrowth={showGrowth}
          setShowGrowth={setShowGrowth}
          showContribution={showContribution}
          setShowContribution={setShowContribution}
        />
        <SummaryTable
          freqList={freqList}
          seriesDefs={seriesDefs}
          data={data}
          seriesState={seriesState}
          minDate={minDate}
          maxDate={maxDate}
          setSeriesState={setSeriesState}
        />
      </Box>
    )
  }

  if (wideScreen && tallScreen) {
    return (
      <Split
        grow="bottom"
        bottom={
          <ComponentChart
            data={data}
            seriesDefs={seriesDefs}
            handleRangeChange={handleRangeChange}
          />
        }
        top={
          <Top />
        }
      />
    )
  }
  else {
    return (
      <Top />
    )
  }
  
}