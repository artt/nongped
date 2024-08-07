import React from 'react'
import { calculateColor, defaultOptions, getAllSeriesNames, getSeries, getTedDataPromise, isAnyParentCollapsed, processSeriesDefinition } from "utils"
import Split from "components/Split"
import type { SeriesDefinition, ContributionMode, SeriesState, ComponentChartData, GdpData, QuarterlyFrequency, Frequency } from "types"
import ComponentChart from "components/ComponentChart"
import SummaryTable from "components/SummaryTable"
import Box from "@mui/material/Box"
import Color from 'color'
import { processGdpData } from './calculation'
import TimeSeriesController from 'components/TimeSeriesController'
import useMediaQuery from '@mui/material/useMediaQuery'

const freqList = ["Q", "Y"]

const inputDefs: SeriesDefinition[] = [
  {
    name: 'gdp',
    label: 'GDP',
    color: defaultOptions.colors[0],
    children: [
      {
        name: 'gde',
        label: 'GDE',
        hide: ["levelReal", "growth", "contribution"],
        children: [
          {
            name: 'dd',
            label: 'Domestic Demand',
            skipLoading: true,
            children: [
              {
                name: 'c',
                label: 'Consumption',
                skipLoading: true,
                children: [
                  {
                    name: 'cp',
                    label: 'Private Consumption',
                    color: Color(defaultOptions.colors[2]).lighten(0.2).hex(),
                  },
                  {
                    name: 'cgov',
                    label: "Gov't Consumption",
                    color: Color(defaultOptions.colors[2]).lighten(-0.2).hex(),
                  },
                ],
              },
              {
                name: 'i',
                label: 'Investment',
                skipLoading: true,
                children: [
                  {
                    name: 'ip',
                    label: "Private Investment",
                    color: defaultOptions.colors[1],
                  },
                  {
                    name: 'ipub',
                    label: "Public Investment",
                    color: Color(defaultOptions.colors[1]).lighten(-0.2).hex(),
                  },
                ],
              },
            ],
          },
          {
            name: 'nx',
            label: 'Net exports',
            skipLoading: true,
            children: [
              {
                name: 'x',
                label: 'Exports',
                skipLoading: true,
                children: [
                  {
                    name: 'xg',
                    label: "Exports of Goods",
                    color: Color(defaultOptions.colors[4]).lighten(0.2).hex(),
                  },
                  {
                    name: 'xs',
                    label: "Exports of Services",
                    color: Color(defaultOptions.colors[4]).lighten(-0.2).hex(),
                  },
                ],
              },
              {
                name: 'm',
                label: 'Imports',
                skipLoading: true,
                negativeContribution: true,
                children: [
                  {
                    name: 'mg',
                    label: "Imports of Goods",
                    color: defaultOptions.colors[3],
                    negativeContribution: true,
                  },
                  {
                    name: 'ms',
                    label: "Imports of Services",
                    color: Color(defaultOptions.colors[3]).lighten(-0.3).hex(),
                    negativeContribution: true,
                  },
                ],
              },
            ],
          },
          {
            name: 'stock',
            label: "Change in Inventories",
            color: defaultOptions.colors[7],
            hide: ["growth"],
          },
        ]
      },
      {
        name: 'stat',
        label: "Statistical Discrepancy",
        color: Color(defaultOptions.colors[7]).lighten(0.3).hex(),
        skipLoading: true,
      }
    ]
  }
]

const seriesDefs = processSeriesDefinition(inputDefs)
calculateColor(seriesDefs)

const gdpSeriesToLoad = getAllSeriesNames(seriesDefs, series => !series.skipLoading)

function getSeriesType(mode: ContributionMode, seriesIndex: number) {
  switch(mode) {
    case "levelReal":
      return seriesIndex > 0 ? 'column' : 'spline'
    case "growth":
      return 'spline'
    case "contribution":
      return seriesIndex > 0 ? 'column' : 'spline'
  }
}

export default function Gdp() {

  const wideScreen = useMediaQuery('(min-width:600px)');
  const tallScreen = useMediaQuery('(min-height:600px)');

  const [processedData, setProcessedData] = React.useState<GdpData>()
  const dataLoaded = React.useRef(false)
  const currentHoveredSeries = React.useRef<string>("")

  const [data, setData] = React.useState<ComponentChartData>()
  const [freq, setFreq] = React.useState<QuarterlyFrequency>((freqList[0] as QuarterlyFrequency))
  const [showGrowth, setShowGrowth] = React.useState(true)
  const [showContribution, setShowContribution] = React.useState(true)
  const [mode, setMode] = React.useState<ContributionMode>("contribution")
  const [minDate, setMinDate] = React.useState<string>()
  const [maxDate, setMaxDate] = React.useState<string>()
  const [seriesState, setSeriesState] = React.useState<SeriesState>({})

  // use ref instead of state to prevent rerenderings
  function setCurrentHoveredSeries(seriesName: string) {
    currentHoveredSeries.current = seriesName
  }

  const handleRangeChange = React.useCallback((minDate: string, maxDate: string) => {
    // TODO: make sure the event is caused by dragging the navigator, not just changing mode, etc.
    setMinDate(minDate)
    setMaxDate(maxDate)
  }, [])

  React.useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    // loop over freqTable
    const promises = []

    for (const freq of freqList) {
      // for quarterly data, just get the *r
      // for yearly data, get deflators as well
      promises.push(getTedDataPromise(gdpSeriesToLoad.map(x => x + "n").concat(gdpSeriesToLoad.map(x => x + "r")), freq, 1993))
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
    // let toBeSliced: number
    // switch(mode) {
    //   case "levelReal":
    //     toBeSliced = 0
    //     break
    //   case "growth":
    //     toBeSliced = freqToNum(freq)
    //     break
    //   case "contribution":
    //     // need to take out 2 to calculate CVM contribution
    //     toBeSliced = freqToNum(freq) * 2
    //     break
    // }
    // toBeSliced = 0
    // * Changed 2023-10-08: leave table empty if there is no data
    const series = processedData[freq].map(s => ({
      name: s.name,
      data: s.data.map(d => ({
        t: d.t,
        v: d[mode],
      })),
    }))
    const chartSeries = series
      .map((s, i) => {
        const curSeries = getSeries(s.name, seriesDefs)
        const toShow = s.name === "gdp" || (!isAnyParentCollapsed(s.name, seriesState, seriesDefs) && !curSeries.hide?.includes(mode) && !(seriesState[s.name]?.isExpanded && curSeries.children.length > 0))
        return({
          id: s.name,
          visible: toShow,
          showInLegend: toShow,
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
    setData({freq, mode, series, chartSeries})
  }, [processedData, freq, mode, seriesState])

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
          setFreq={(setFreq as (freq: Frequency) => void)} // a bit of a hack here
          showGrowth={showGrowth}
          setShowGrowth={setShowGrowth}
          showContribution={showContribution}
          setShowContribution={setShowContribution}
        />
        <SummaryTable
          freqList={freqList}
          seriesDefs={seriesDefs}
          headerWidth={220}
          cellWidths={{ levelReal: 100, growth: 55, contribution: 55 }}
          data={data}
          seriesState={seriesState}
          minDate={minDate}
          maxDate={maxDate}
          setSeriesState={setSeriesState}
          setCurrentHoveredSeries={setCurrentHoveredSeries}
          digits={{ levelReal: 0 }}
        />
      </Box>
    )
  }

  if (wideScreen && tallScreen) {
    return (
      <Split
        grow="bottom"
        top={
          <Top />
        }
        bottom={
          <ComponentChart
            data={data}
            seriesDefs={seriesDefs}
            override={{
              yAxis: {
                reversedStacks: false,
              }
            }}
            handleRangeChange={handleRangeChange}
            currentHoveredSeries={currentHoveredSeries.current}
          />
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