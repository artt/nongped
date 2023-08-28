import React from 'react'
import { freqToNum, getTedDataPromise } from "utils"
import type { freqType, LabelDefType, TedDataType, TimeSeriesWithFrequenciesType, ProcessedDataType } from "types"
import { defaultOptions } from "utils"
import Split from "components/Split"
import TimeSeriesChart from "components/ComponentChart"
import SummaryTable from "components/SummaryTable"
import Box from "@mui/material/Box"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import FormGroup from "@mui/material/FormGroup"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import ToggleButton from "@mui/material/ToggleButton"

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

  const [data, setData] = React.useState<ProcessedDataType>()
  const [freq, setFreq] = React.useState<freqType>((freqList[0] as freqType))
  const [showGrowth, setShowGrowth] = React.useState(true)
  const [showContribution, setShowContribution] = React.useState(true)
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

  React.useEffect(() => {
    if (!rawData) return
    setData({
      freq: freq,
      showGrowth: showGrowth,
      showContribution: showContribution,
      series: rawData[freq].map(series => ({
        name: series.name,
        data: series.data.slice(showGrowth ? freqToNum(freq) : 0).map(d => ({
          t: d.t,
          v: (showContribution && showGrowth) ? d.c : showGrowth ? d.g : d.v,
        })),
      })),
    })
  }, [freq, rawData, showGrowth, showContribution])

  if (!data) return null

  return (
    <Split
      top={
        <TimeSeriesChart
          freqList={freqList}
          labelDefs={labelDefs}
          chartData={data}
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