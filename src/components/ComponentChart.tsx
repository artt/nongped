import React from "react"
import HighchartsWrapper from "components/HighchartsWrapper"
import type { ComponentChartData, ProcessedSeriesDefinition, TooltipPoint } from "types"
import Box from "@mui/material/Box"
import { tooltipPercentFormatter, ticksPercentFormatter, getSeries, quarterToMonth } from "utils"
import { HighchartsReactRefObject } from 'highcharts-react-official';
import deepmerge from 'deepmerge'

interface Props {
  data?: ComponentChartData,
  seriesDefs: ProcessedSeriesDefinition[],
  override?: Highcharts.Options,
  explodeKeyHeld?: boolean,
  handleRangeChange: (minDate: string, maxDate: string) => void,
  currentHoveredSeries?: string,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const ComponentChart = React.forwardRef(({ data, seriesDefs, override, handleRangeChange, currentHoveredSeries }: Props, forwardedRef) => {
function ComponentChart({ data, seriesDefs, override, handleRangeChange, currentHoveredSeries }: Props) {
  
  const [explodeKeyHeld, setExplodeKeyHeld] = React.useState(false)
  const ref = React.useRef<HighchartsReactRefObject>(null)

  // universal keyboard handler
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'c') {
      setExplodeKeyHeld(true)
    }
  }
  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'c') {
      setExplodeKeyHeld(false)
    }
  }

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  React.useEffect(() => {
    const chart = ref.current?.chart
    if (!chart) return
    console.log('currentHoveredSeries', currentHoveredSeries)
    chart.series.forEach(s => {
      s.setState('inactive')
      // if (s.userOptions.id === currentHoveredSeries) {
      //   console.log(s)
      //   s.setState('hover', true)
      // }
      // else {
      //   s.setState('inactive', true)
      // }
    })
  }, [currentHoveredSeries])

  return(
    <Box
      sx={{
        height: '100%',
        width: '100%',
        position: 'absolute',
      }}
    >
      <HighchartsWrapper
        ref={ref}
        currentHoveredSeries={currentHoveredSeries}
        useHighchartsStock={true}
        isLoading={!data}
        constructorType={'stockChart'}
        options={data && deepmerge({
          series: data.series.map((s, i) => ({
            name: getSeries(s.name, seriesDefs).label,
            data: s.data.map(p => p.v),
            ...data.chartSeries[i],
          })),
          plotOptions: {
            column: {
              stacking: 'normal',
              crisp: false,
            },
            series: {
              dataGrouping: {
                enabled: false,
              },
              pointIntervalUnit: data.freq === 'Y' ? 'year' : 'month',
              pointInterval: data.freq === "Q" ? 3 : 1,
              pointStart: Date.parse(data.freq === 'Q' ? quarterToMonth(data.series[0].data[0].t) : data.series[0].data[0].t),
            },
          },
          legend: {
            enabled: true,
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
          },
          tooltip: {
            valueDecimals: data.mode === "levelReal" ? 0 : 2,
            formatter: data.mode !== "levelReal" && function(this: TooltipPoint, tooltip: Highcharts.Tooltip) {
              return tooltipPercentFormatter(this, tooltip, data.freq)
            },
            split: false,
            shared: !explodeKeyHeld,
          },
          scrollbar: {
            enabled: false
          },
          xAxis: {
            type: 'datetime',
            labels: {
              format: data.freq === 'Q' && '{value:%YQ%q}',
            },
            events: {
              afterSetExtremes: function(e: { min: number, max: number }) {
                // let the parent component know that the user has changed the range
                // so that the summary table could be updated too
                if (!e) return
                const { min, max } = e
                if (!min || !max) return
                const minDate = new Date(min).toISOString().slice(0, 7)
                const maxDate = new Date(max).toISOString().slice(0, 7)
                handleRangeChange(minDate, maxDate)
              },
            },
          },
          yAxis: {
            labels: {
              align: 'left',
              formatter: data.mode !== "levelReal" && ticksPercentFormatter,
            },
            offset: 10,
            plotLines: [{
              color: 'black',
              value: 0,
              width: 2,
              zIndex: 3,
            }],
          },
        }, override || {})}
      />
    </Box>
  )
}

export default ComponentChart