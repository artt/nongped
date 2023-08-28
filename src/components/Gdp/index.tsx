import React from 'react'
import { getTedDataPromise } from "utils"
import Split from "components/Split"
import { freqToNum } from "utils"
import type { freqType, LabelDefType, TedDataType, TimeSeriesWithFrequenciesType, ProcessedDataType } from "types"
import TimeSeriesChart from "components/ComponentChart"
import SummaryTable from "components/SummaryTable"
import Box from "@mui/material/Box"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import FormGroup from "@mui/material/FormGroup"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import ToggleButton from "@mui/material/ToggleButton"

const freqList = ["Q", "Y"]

const labelDefs: LabelDefType = {
  gdpr: {
    label: 'GDP',
  },
  gder: {
    label: 'GDE',
    hideInContributionChart: true,
  },
  cpr: {
    label: 'Private Consumption',
  },
  cgovr: {
    label: "Gov't Consumption",
  },
  ipr: {
    label: "Private Investment",
  },
  ipubr: {
    label: "Public Investment",
  },
  stockr: {
    label: "Stock Change",
    hideInGrowthChart: true,
  },
  xgr: {
    label: "Exports of Goods",
  },
  xsr: {
    label: "Exports of Services",
  },
  mgr: {
    label: "Imports of Goods",
    negativeContribution: true,
  },
  msr: {
    label: "Imports of Services",
    negativeContribution: true,
  },
}
const gdpSeries = Object.keys(labelDefs)

export default function Gdp() {

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

  // convert string *r to *_deflator
  function getDeflatorName(xr: string) {
    return xr.slice(0, -1) + "_deflator"
  }

  function processGdpData(tmp: TedDataType[]) {
    
    const data = {
      Q: tmp[0],
      Y: tmp[1],
    }
    
    const gdeIndex = 1
    const gdeDeflator = data.Y.series[gdpSeries.length + gdeIndex].values
    const gderYearly = data.Y.series[gdeIndex].values
    const gderQuarterly = data.Q.series[gdeIndex].values

    const processedYearlyData = data.Y.series.slice(0, gdpSeries.length).map((series: {name: string, values: number[]}, seriesIndex: number) => {
      const deflator = data.Y.series[seriesIndex + gdpSeries.length].values
      const negativeContribution = labelDefs[series.name].negativeContribution
      return({
        name: series.name,
        data: series.values.map((_, i: number, a: number[]) => ({
          t: data.Y.periods[i],
          v: a[i],
          g: (a[i] / a[i - 1] - 1),
          c: seriesIndex < 2
              ? (a[i] / a[i - 1] - 1)
              : (negativeContribution ? -1 : 1) * ((a[i] - a[i - 1]) / gderYearly[i - 1] * (deflator[i - 1] / gdeDeflator[i - 1])),
        })),
      })
    })

    const processedQuarterlyData = data.Q.series.map((series: {name: string, values: number[]}, seriesIndex: number) => {
      // we only use yearly deflator, so this Y is not a typo
      const deflator = data.Y.series[seriesIndex + gdpSeries.length].values
      const seriesYearly = data.Y.series[seriesIndex].values
      const negativeContribution = labelDefs[series.name].negativeContribution
      if (series.name === "mgr" || series.name === "msr") {
        console.log("xx", negativeContribution)
      }
      return({
        name: series.name,
        data: series.values.map((_, i: number, a: number[]) => {
          const yi = Math.floor(i / 4) // yearly index
          return({
            t: data.Q.periods[i],
            v: a[i],
            g: (a[i] / a[i - 4] - 1),
            // whattttttttttt
            c: yi < 2
                ? NaN
                : seriesIndex < 2
                  ? (a[i] / a[i - 4] - 1)
                  : (negativeContribution ? -1 : 1) * (((a[i] - a[i - 4]) / gderQuarterly[i - 4] * deflator[yi - 1] / gdeDeflator[yi - 1]) + (a[i - 4] / gderQuarterly[i - 4] - seriesYearly[yi - 1] / gderYearly[yi - 1]) * (deflator[yi - 1] / gdeDeflator[yi - 1] - deflator[yi - 2] / gdeDeflator[yi - 2])),
          })
        }),
      })
    })

    console.log(processedYearlyData)

    return({
      Q: processedQuarterlyData,
      Y: processedYearlyData,
    })
  }

  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    const deflatorSeries = gdpSeries.map(getDeflatorName)
    const promises = []
    for (const freq of freqList) {
      // for quarterly data, just get the *r
      // for yearly data, get deflators as well
      promises.push(getTedDataPromise(freq === "Q" ? gdpSeries : gdpSeries.concat(deflatorSeries), freq, 1993))
    }
    Promise.all(promises).then(res => {
      setRawData(processGdpData(res))
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
            headerWidth={150}
            cellWidth={55}
            data={data}
            minDate={minDate}
            maxDate={maxDate}
          />
        </Box>
      }
    />
  )

}