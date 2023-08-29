import React from 'react'
import { defaultOptions, getTedDataPromise } from "utils"
import Split from "components/Split"
import { freqToNum, quarterToMonth } from "utils"
import type { freqType, LabelDefType, TedDataType, TimeSeriesWithFrequenciesType, ComponentChartDataType, modeType } from "types"
import ComponentChart from "components/ComponentChart"
import SummaryTable from "components/SummaryTable"
import Box from "@mui/material/Box"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import FormGroup from "@mui/material/FormGroup"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import ToggleButton from "@mui/material/ToggleButton"
import Color from 'color'

const freqList = ["Q", "Y"]

const labelDefs: LabelDefType = {
  gdpr: {
    label: 'GDP',
    color: defaultOptions.colors[0],
  },
  gder: {
    label: 'GDE',
    hide: ["level", "growth", "contribution"],
  },
  cpr: {
    label: 'Private Consumption',
    color: defaultOptions.colors[2],
  },
  cgovr: {
    label: "Gov't Consumption",
    color: Color(defaultOptions.colors[2]).lighten(-0.3).hex(),
  },
  ipr: {
    label: "Private Investment",
    color: defaultOptions.colors[1],
  },
  ipubr: {
    label: "Public Investment",
    color: Color(defaultOptions.colors[1]).lighten(-0.2).hex(),
  },
  xgr: {
    label: "Exports of Goods",
    color: defaultOptions.colors[4],
  },
  xsr: {
    label: "Exports of Services",
    color: Color(defaultOptions.colors[4]).lighten(-0.3).hex(),
  },
  mgr: {
    label: "Imports of Goods",
    color: defaultOptions.colors[3],
    negativeContribution: true,
  },
  msr: {
    label: "Imports of Services",
    color: Color(defaultOptions.colors[3]).lighten(-0.3).hex(),
    negativeContribution: true,
  },
  stockr: {
    label: "Change in Inventories",
    color: defaultOptions.colors[7],
    hide: ["growth"],
  },
  // statr: {
  //   label: "Statistical Discrepancy",
  //   color: Color(defaultOptions.colors[7]).lighten(0.3).hex(),
  //   skipLoading: true,
  // },
}
const gdpSeries = Object.keys(labelDefs)

function getSeriesType(mode: modeType, seriesIndex: number) {
  switch(mode) {
    case "level":
      return seriesIndex > 0 ? 'column' : 'spline'
    case "growth":
      return 'spline'
    case "contribution":
      return seriesIndex > 0 ? 'column' : 'spline'
  }
}

export default function Gdp() {

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
          level: (negativeContribution ? -1 : 1) * a[i],
          growth: (a[i] / a[i - 1] - 1),
          contribution: seriesIndex < 2
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
      return({
        name: series.name,
        data: series.values.map((_, i: number, a: number[]) => {
          const yi = Math.floor(i / 4) // yearly index
          return({
            t: data.Q.periods[i],
            level: (negativeContribution ? -1 : 1) * a[i],
            growth: (a[i] / a[i - 4] - 1),
            // whattttttttttt
            contribution: yi < 2
                ? NaN
                : seriesIndex < 2
                  ? (a[i] / a[i - 4] - 1)
                  : (negativeContribution ? -1 : 1) * (((a[i] - a[i - 4]) / gderQuarterly[i - 4] * deflator[yi - 1] / gdeDeflator[yi - 1]) + (a[i - 4] / gderQuarterly[i - 4] - seriesYearly[yi - 1] / gderYearly[yi - 1]) * (deflator[yi - 1] / gdeDeflator[yi - 1] - deflator[yi - 2] / gdeDeflator[yi - 2])),
          })
        }),
      })
    })

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

  // set mode from toggles
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
    let toBeSliced: number
    switch(mode) {
      case "level":
        toBeSliced = 0
        break
      case "growth":
        toBeSliced = freqToNum(freq)
        break
      case "contribution":
        // need to take out 2 to calculate CVM contribution
        toBeSliced = freqToNum(freq) * 2
        break
    }
    const tableSeries = rawData[freq].map(series => ({
      name: series.name,
      data: series.data.slice(toBeSliced).map(d => ({
        t: d.t,
        v: d[mode],
      })),
    }))
    // const chartSeries = deepmerge([], tableSeries)
    const chartSeries = tableSeries
      .map((series, i) => ({
        visible: !labelDefs[series.name].hide?.includes(mode),
        showInLegend: !labelDefs[series.name].hide?.includes(mode),
        name: labelDefs[series.name].label,
        color: labelDefs[series.name].color,
        marker: {
          enabled: i === 0,
          fillColor: 'white',
          lineColor: null,
          lineWidth: 2,
          radius: 4,
        },
        zIndex: i === 0 ? 99 : i,
        data: series.data.map(p => p.v),
        // in contribution mode, only the first series is a line chart
        type: getSeriesType(mode, i),
        pointStart: Date.parse(freq === 'Q' ? quarterToMonth(series.data[0].t) : series.data[0].t),
        pointIntervalUnit: freq === 'Y' ? 'year' : 'month',
        pointInterval: freq === 'Q' ? 3 : 1,
      }))
    setData({freq, mode, tableSeries, chartSeries})
  }, [rawData, freq, mode])

  if (!data) return null

  return (
    <Split
      top={
        <ComponentChart
          freqList={freqList}
          labelDefs={labelDefs}
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