import React from 'react'
import { defaultOptions, getAllSeriesNames, getSeriesIndex, getTedDataPromise, processSeriesDefinition } from "utils"
import Split from "components/Split"
import { freqToNum, quarterToMonth } from "utils"
import type { SeriesDefinition, ContributionMode, SeriesState, ComponentChartData, GdpData, QuarterlyFrequency } from "types"
import ComponentChart from "components/ComponentChart"
import SummaryTable from "components/SummaryTable"
import Box from "@mui/material/Box"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import FormGroup from "@mui/material/FormGroup"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import ToggleButton from "@mui/material/ToggleButton"
import Color from 'color'
import { processGdpData } from './calculation'

const freqList = ["Q", "Y"]

const inputDefs: SeriesDefinition[] = [
  {
    name: 'gdpr',
    label: 'GDP',
    color: defaultOptions.colors[0],
    children: [
      {
        name: 'gder',
        label: 'GDE',
        hide: ["level", "growth", "contribution"],
        children: [
          {
            name: 'ddr',
            label: 'Domestic Demand',
            hide: ["level", "growth", "contribution"],
            skipLoading: true,
            children: [
              {
                name: 'cr',
                label: 'Consumption',
                hide: ["level", "growth", "contribution"],
                skipLoading: true,
                children: [
                  {
                    name: 'cpr',
                    label: 'Private Consumption',
                    color: defaultOptions.colors[2],
                  },
                  {
                    name: 'cgovr',
                    label: "Gov't Consumption",
                    color: Color(defaultOptions.colors[2]).lighten(-0.3).hex(),
                  },
                ],
              },
              {
                name: 'ir',
                label: 'Investment',
                hide: ["level", "growth", "contribution"],
                skipLoading: true,
                children: [
                  {
                    name: 'ipr',
                    label: "Private Investment",
                    color: defaultOptions.colors[1],
                  },
                  {
                    name: 'ipubr',
                    label: "Public Investment",
                    color: Color(defaultOptions.colors[1]).lighten(-0.2).hex(),
                  },
                ],
              },
            ],
          },
          {
            name: 'nxr',
            label: 'Net exports',
            hide: ["level", "growth", "contribution"],
            skipLoading: true,
            children: [
              {
                name: 'xr',
                label: 'Exports',
                hide: ["level", "growth", "contribution"],
                skipLoading: true,
                children: [
                  {
                    name: 'xgr',
                    label: "Exports of Goods",
                    color: defaultOptions.colors[4],
                  },
                  {
                    name: 'xsr',
                    label: "Exports of Services",
                    color: Color(defaultOptions.colors[4]).lighten(-0.3).hex(),
                  },
                ],
              },
              {
                name: 'mr',
                label: 'Imports',
                hide: ["level", "growth", "contribution"],
                skipLoading: true,
                children: [
                  {
                    name: 'mgr',
                    label: "Imports of Goods",
                    color: defaultOptions.colors[3],
                    negativeContribution: true,
                  },
                  {
                    name: 'msr',
                    label: "Imports of Services",
                    color: Color(defaultOptions.colors[3]).lighten(-0.3).hex(),
                    negativeContribution: true,
                  },
                ],
              },
            ],
          },
          {
            name: 'stockr',
            label: "Change in Inventories",
            color: defaultOptions.colors[7],
            hide: ["growth"],
          },
        ]
      },
      {
        name: 'statr',
        label: "Statistical Discrepancy",
        color: Color(defaultOptions.colors[7]).lighten(0.3).hex(),
        skipLoading: true,
      }
    ]
  }
]

const seriesDefs = processSeriesDefinition(inputDefs)

// const gdpSeries = getAllSeriesNames(labelDefs)
const gdpSeriesToLoad = getAllSeriesNames(seriesDefs, series => !series.skipLoading)
// const gdpSeriesToCalculate = getAllSeriesNames(seriesDefs, series => series.skipLoading === true)

function getSeriesType(mode: ContributionMode, seriesIndex: number) {
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

  const [processedData, setProcessedData] = React.useState<GdpData>()
  const dataLoaded = React.useRef(false)

  const [data, setData] = React.useState<ComponentChartData>()
  const [freq, setFreq] = React.useState<QuarterlyFrequency>((freqList[0] as QuarterlyFrequency))
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

  // convert string *r to *_deflator
  function getDeflatorName(xr: string) {
    return xr.slice(0, -1) + "_deflator"
  }

  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    const deflatorSeries = gdpSeriesToLoad.map(getDeflatorName)
    const promises = []

    for (const freq of freqList) {
      // for quarterly data, just get the *r
      // for yearly data, get deflators as well
      promises.push(getTedDataPromise(freq === "Q" ? gdpSeriesToLoad : gdpSeriesToLoad.concat(deflatorSeries), freq, 1993))
    }
    Promise.all(promises).then(res => {
      setProcessedData(processGdpData(res, seriesDefs, gdpSeriesToLoad))
    })
    // set initial states for series
    setSeriesState(getAllSeriesNames(seriesDefs).reduce((acc, name) => {
      acc[name] = {
        isExpanded: true,
        isParentCollapsed: false,
      }
      return acc
    }, {} as SeriesState))
  }, [])

  // set mode from toggles
  // TODO: can factor this out into a custom component, shared wtih Inflation
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
    if (!processedData) return
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
    const series = processedData[freq].map(s => ({
      name: s.name,
      data: s.data.slice(toBeSliced).map(d => ({
        t: d.t,
        v: d[mode],
      })),
    }))
    const pointStart = Date.parse(freq === 'Q' ? quarterToMonth(series[0].data[0].t) : series[0].data[0].t)
    const chartSeries = series
      .map((s, i) => {
        // const curSeries = getSeries(s.name, seriesDefs) as ProcessedSeriesDefinition
        const curSeries = seriesDefs[getSeriesIndex(s.name, seriesDefs)]
        return({
          visible: !curSeries.hide?.includes(mode),
          showInLegend: !curSeries.hide?.includes(mode),
          color: curSeries.color,
          marker: {
            enabled: i === 0,
            fillColor: 'white',
            lineColor: null,
            lineWidth: 2,
            radius: 4,
          },
          zIndex: i === 0 ? 99 : i,
          // in contribution mode, only the first series is a line chart
          type: getSeriesType(mode, i),
        })
      })
    setData({freq, mode, pointStart, series, chartSeries})
  }, [processedData, freq, mode])

  return (
    <Split
      grow="bottom"
      top={
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
              onChange={(_e, newFreq: QuarterlyFrequency) => {
                if (newFreq === null) return
                setFreq((newFreq as QuarterlyFrequency))
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
            seriesDefs={seriesDefs}
            headerWidth={200}
            cellWidth={mode === "level" ? 100 : 55}
            data={data}
            seriesState={seriesState}
            minDate={minDate}
            maxDate={maxDate}
            setSeriesState={setSeriesState}
            digits={{ level: 0 }}
          />
        </Box>
      }
      bottom={
        <ComponentChart
          data={data}
          seriesDefs={seriesDefs}
          handleRangeChange={handleRangeChange}
        />
      }
    />
  )

}