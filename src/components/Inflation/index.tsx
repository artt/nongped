import React from 'react'
import { freqToNum, getTedDataPromise } from "utils"
import type {
  freqType,
  SeriesDefType,
  TedDataType,
  TimeSeriesWithFrequenciesType,
  ComponentChartDataType,
  modeType
} from "types"
import { quarterToMonth } from "utils"
import Split from "components/Split"
import ComponentChart from "components/ComponentChart"
import SummaryTable from "components/SummaryTable"
import Box from "@mui/material/Box"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import FormGroup from "@mui/material/FormGroup"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import ToggleButton from "@mui/material/ToggleButton"
import { HighchartsReact } from 'highcharts-react-official'

const labelDefs: SeriesDefType = {
  cpi: {
    label: 'CPI',
  },
  cpi_core: {
    label: 'Core',
  },
  cpi_rawfood: {
    label: 'Raw Food',
  },
  cpi_energy: {
    label: 'Energy',
  },
}

const freqList = ["M", "Q", "Y"]

// https://www.price.moc.go.th/price/fileuploader/file_cpi/cpi_note_2562.pdf
// TODO: apply correct weights
// const weights15 = [100, 72.56, 15.69, 11.75]
const weights19 = [100, 67.06, 20.55, 12.39]

export default function Inflation() {

  const ref = React.useRef<typeof HighchartsReact>(null)
  
  const [rawData, setRawData] = React.useState<TimeSeriesWithFrequenciesType>()
  const dataLoaded = React.useRef(false)

  const [data, setData] = React.useState<ComponentChartDataType>()
  const [freq, setFreq] = React.useState<freqType>((freqList[0] as freqType))
  const [showGrowth, setShowGrowth] = React.useState(true)
  const [showContribution, setShowContribution] = React.useState(true)
  const [mode, setMode] = React.useState<modeType>("contribution")
  const [minDate, setMinDate] = React.useState<string>()
  const [maxDate, setMaxDate] = React.useState<string>()

  const handleRangeChange = React.useCallback((minDate: string, maxDate: string) => {
    setMinDate(minDate)
    setMaxDate(maxDate)
  }, [])

  function processInflationData(data: TedDataType, freq: freqType) {
    const numFreq = freqToNum(freq)
    return(data.series.map((series: {name: string, values: number[]}, seriesIndex: number) => ({
      name: series.name,
      data: series.values.map((_, i: number, a: number[]) => ({
        t: data.periods[i],
        level: a[i],
        growth: (a[i] / a[i - numFreq] - 1),
        contribution: (a[i] / a[i - numFreq] - 1) * weights19[seriesIndex] / 100,
      })),
    })))
  }

  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    const promises = []
    for (const freq of freqList) {
      promises.push(getTedDataPromise(Object.keys(labelDefs), freq, 1986)
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

  // React.useEffect(() => {
  //   if (ref.current === null) return
  //   if ('chart' in ref.current) {
  //     (ref.current.chart as Highcharts.Chart).update({
  //       tooltip: {
  //         shared: !explodeKeyHeld,
  //       }
  //     })
  //   }
  // }, [explodeKeyHeld])

  React.useEffect(() => {
    if (!showGrowth) {
      setMode("level")
    }
    else if (!showContribution) {
      setMode("growth")
    }
    else {
      setMode("contribution")
    }
  }, [showGrowth, showContribution])

  React.useEffect(() => {
    if (!rawData) return
    const tableSeries = rawData[freq].map(series => ({
      name: series.name,
      data: series.data.slice(mode === "level" ? 0 : freqToNum(freq)).map(d => ({
        t: d.t,
        v: d[mode],
      })),
    }))
    const chartSeries = tableSeries
      .map((series, i) => ({
        name: labelDefs[series.name].label,
        color: labelDefs[series.name].color,
        findNearestPointBy: i === 0 ? 'x' : 'xy',
        zIndex: i === 0 ? 99 : i,
        data: series.data.map(p => p.v),
        // in contribution mode, only the first series is a line chart
        type: mode === "contribution" && i > 0 ? 'column' : 'spline',
        pointStart: Date.parse(freq === 'Q' ? quarterToMonth(series.data[0].t) : series.data[0].t),
        pointIntervalUnit: freq === 'Y' ? 'year' : 'month',
        pointInterval: freq === 'Q' ? 3 : 1,
      }))
    setData({freq, mode, tableSeries, chartSeries})
  }, [rawData, freq, mode])

  return (
    <Split
      top={
        <ComponentChart
          ref={ref}
          data={data}
          handleRangeChange={handleRangeChange}
        />
      }
      bottom={
        <Box sx={{
          display: "flex",
          width: '100%',
          gap: 4,
        }}>
          <Box>
            <ToggleButtonGroup
              value={freq}
              size="small"
              exclusive
              onChange={(_e, newFreq: keyof TimeSeriesWithFrequenciesType) => {
                if (newFreq === null) return
                setFreq((newFreq as freqType))
              }}
              aria-label="frequency"
              fullWidth
              sx={{marginBottom: 2}}
            >
              {freqList.map(freq => (
                <ToggleButton key={freq} value={freq} aria-label={`${freq}ly`}>
                  {freq}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <FormGroup>
              <FormControlLabel
                control={<Switch
                  checked={showGrowth}
                  onChange={() => setShowGrowth(!showGrowth)}
                />}
                label="Growth"
              />
              <FormControlLabel
                control={<Switch
                  checked={showContribution}
                  onChange={() => setShowContribution(!showContribution)}
                />}
                label="Contribution"
                disabled={!showGrowth}
              />
            </FormGroup>
          </Box>
          <SummaryTable
            freqList={freqList}
            labelDefs={labelDefs}
            data={data}
            minDate={minDate}
            maxDate={maxDate}
          />
        </Box>
      }
    />
  )
  
}