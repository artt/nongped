import React from 'react'
import { freqToNum, getAllSeriesNames, getSeries, getTedDataPromise } from "utils"
import type {
  SeriesDefinition,
  TedData,
  ProcessedData,
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

const labelDefs: SeriesDefinition[] = [
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

const freqList = ["M", "Q", "Y"]

// https://www.price.moc.go.th/price/fileuploader/file_cpi/cpi_note_2562.pdf
// TODO: apply correct weights
// const weights15 = [100, 72.56, 15.69, 11.75]
const weights19 = [100, 67.06, 20.55, 12.39]

type RawData = {
  M: ProcessedData,
  Q: ProcessedData,
  Y: ProcessedData,
}

type Frequency = keyof RawData

export default function Inflation() {

  const ref = React.useRef<typeof HighchartsReact>(null)
  
  const [rawData, setRawData] = React.useState<RawData>()
  const dataLoaded = React.useRef(false)

  const [data, setData] = React.useState<ComponentChartDataType>()
  const [freq, setFreq] = React.useState<Frequency>((freqList[0] as Frequency))
  const [showGrowth, setShowGrowth] = React.useState(true)
  const [showContribution, setShowContribution] = React.useState(true)
  const [mode, setMode] = React.useState<modeType>("contribution")
  const [minDate, setMinDate] = React.useState<string>()
  const [maxDate, setMaxDate] = React.useState<string>()

  const handleRangeChange = React.useCallback((minDate: string, maxDate: string) => {
    setMinDate(minDate)
    setMaxDate(maxDate)
  }, [])

  function processInflationData(data: TedData, freq: Frequency) {
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

  // load data upon first render
  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    // TODO: can process each frequency separately and not have to wait for all to finish
    const promises = []
    for (const freq of freqList) {
      promises.push(getTedDataPromise(getAllSeriesNames(labelDefs), freq, 1986)
        .then(res => processInflationData(res, (freq as Frequency)))
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
        name: getSeries(series.name, labelDefs).label,
        color: getSeries(series.name, labelDefs).color,
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
              onChange={(_e, newFreq: Frequency) => {
                if (newFreq === null) return
                setFreq((newFreq as Frequency))
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