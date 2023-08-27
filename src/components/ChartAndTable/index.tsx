import React from "react"
import Split from "components/Split"
import { freqDefs, freqToNum, freqToString } from "utils"
import type { freqType, TimeSeriesWithFrequenciesType } from "utils"
import TimeSeriesChart from "./TimeSeriesChart"
import SummaryTable from "./SummaryTable"
import "./styles.scss"
import Box from "@mui/material/Box"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import FormGroup from "@mui/material/FormGroup"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import ToggleButton from "@mui/material/ToggleButton"



export type ProcessedData = {
  freq: keyof TimeSeriesWithFrequenciesType,
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

export default function ChartAndTable({ rawData }: { rawData?: TimeSeriesWithFrequenciesType }) {

  const [data, setData] = React.useState<ProcessedData>()
  const [freq, setFreq] = React.useState<keyof TimeSeriesWithFrequenciesType>("M")
  const [showGrowth, setShowGrowth] = React.useState(true)
  const [showContribution, setShowContribution] = React.useState(true)
  const [minDate, setMinDate] = React.useState<string>()
  const [maxDate, setMaxDate] = React.useState<string>()

  const handleRangeChange = React.useCallback((minDate: string, maxDate: string) => {
    setMinDate(minDate)
    setMaxDate(maxDate)
  }, [])

  React.useEffect(() => {
    if (!rawData) return
    setData({
      freq: freq,
      showGrowth: showGrowth,
      showContribution: showContribution,
      series: rawData[freq]?.map(series => ({
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
              onChange={(_e, newFreq: keyof TimeSeriesWithFrequenciesType) => {
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
