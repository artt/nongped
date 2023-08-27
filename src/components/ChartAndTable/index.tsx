import React from "react"
import Split from "components/Split"
import { freqDefs, freqToNum, freqToString, getTedDataPromise } from "utils"
import type { freqType } from "utils"
import TimeSeriesChart from "./TimeSeriesChart"
import SummaryTable from "./SummaryTable"
import "./styles.scss"
import Box from "@mui/material/Box"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import FormGroup from "@mui/material/FormGroup"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import ToggleButton from "@mui/material/ToggleButton"

export type TedData = {
  periods: string[],
  series: {
    name: string,
    values: number[],
  }[],
}

export type InflationDataWithFrequencies = {
  M: InflationData,
  Q: InflationData,
  Y: InflationData,
}

export type InflationData = {
  name: string,
  data: {
    t: string,
    v: number,
    g: number,
    c: number,
  }[],
}[]

export type ProcessedData = {
  freq: keyof InflationDataWithFrequencies,
  showGrowth: boolean,
  showContribution: boolean,
  series: {
    name: string,
    data: {
      t: string,
      v: number,
    }[],
  }[],
}

// https://www.price.moc.go.th/price/fileuploader/file_cpi/cpi_note_2562.pdf
// TODO: apply correct weights
// const weights15 = [100, 72.56, 15.69, 11.75]
const weights19 = [100, 67.06, 20.55, 12.39]

export default function ChartAndTable() {

  const [data, setData] = React.useState<ProcessedData>()
  const [rawData, setRawData] = React.useState<InflationDataWithFrequencies>()
  const [freq, setFreq] = React.useState<keyof InflationDataWithFrequencies>("M")
  const [showGrowth, setShowGrowth] = React.useState(true)
  const [showContribution, setShowContribution] = React.useState(true)
  const [minDate, setMinDate] = React.useState<string>()
  const [maxDate, setMaxDate] = React.useState<string>()
  const dataLoaded = React.useRef(false)

  const handleRangeChange = React.useCallback((minDate: string, maxDate: string) => {
    setMinDate(minDate)
    setMaxDate(maxDate)
  }, [])

  function processTedData(data: TedData, freq: freqType) {
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
              onChange={(_e, newFreq: keyof InflationDataWithFrequencies) => {
                if (newFreq === null) return
                setFreq(newFreq)
              }}
              aria-label="frequency"
              fullWidth
              sx={{marginBottom: 2}}
            >
              {Object.keys(freqDefs).map(freq => (
                <ToggleButton key={freq} value={freq} aria-label={`${freq}ly`}>
                  {freqToString(freq as freqType)}
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
          <SummaryTable data={data} minDate={minDate} maxDate={maxDate} />
        </Box>
      }
    />
  )
}
