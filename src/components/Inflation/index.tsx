import React from "react"
import { defaultOptions } from "components/HighchartsWrapper"
import Split from "components/Split";
import { freqToNum, getTedDataPromise } from "utils"
import TimeSeriesChart from "./TimeSeriesChart";
import SummaryTable from "./SummaryTable";
import "./styles.scss"
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";

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

export const labelDefs: {[x: string]: {label: string, color: string}} = {
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

// https://www.price.moc.go.th/price/fileuploader/file_cpi/cpi_note_2562.pdf
// TODO: apply correct weights
// const weights15 = [100, 72.56, 15.69, 11.75]
const weights19 = [100, 67.06, 20.55, 12.39]

export default function Inflation() {

  const [data, setData] = React.useState<ProcessedData>()
  const [rawData, setRawData] = React.useState<InflationDataWithFrequencies>()
  const [freq, setFreq] = React.useState<keyof InflationDataWithFrequencies>("M")
  const [showGrowth, setShowGrowth] = React.useState(true)
  const [showContribution, setShowContribution] = React.useState(true)
  const [minDate, setMinDate] = React.useState<string>()
  const [maxDate, setMaxDate] = React.useState<string>()
  // const minDateRef = React.useRef<string>()
  // const maxDateRef = React.useRef<string>()
  const dataLoaded = React.useRef(false)

  const handleRangeChange = React.useCallback((minDate: string, maxDate: string) => {
    setMinDate(minDate)
    setMaxDate(maxDate)
  }, [])

  function processTedData(data: any, freq: string) {
    const numFreq = freq === "M" ? 12 : freq === "Q" ? 4 : 1
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
    for (const freq of ["M", "Q", "Y"]) {
      promises.push(getTedDataPromise(["cpi", "cpi_core", "cpi_rawfood", "cpi_energy"], freq, 1986)
        .then(res => processTedData(res, freq))
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
          <Box sx={{
            // position: 'absolute',
            // top: 0,
            // left: '50%',
            // transform: 'translateX(-50%)',
          }}>
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
              <ToggleButton value="M" aria-label="monthly">
                M
              </ToggleButton>
              <ToggleButton value="Q" aria-label="quarterly">
                Q
              </ToggleButton>
              <ToggleButton value="Y" aria-label="yearly">
                Y
              </ToggleButton>
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
