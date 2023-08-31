import React from "react"
import HighchartsWrapper from "components/HighchartsWrapper"
import type { ComponentChartDataType, TooltipPoint } from "types"
import Box from "@mui/material/Box"
import { tooltipPercentFormatter, ticksPercentFormatter } from "utils"

interface Props {
  data: ComponentChartDataType,
  explodeKeyHeld?: boolean,
  handleRangeChange: (minDate: string, maxDate: string) => void,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ComponentChart = React.forwardRef(({ data, handleRangeChange }: Props, _refJustInCase) => {
  
  const [explodeKeyHeld, setExplodeKeyHeld] = React.useState(false)
  const ref = React.useRef<Highcharts.Chart>()

  // universal keyboard handler
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 't') {
      setExplodeKeyHeld(true)
    }
  }
  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 't') {
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
    if (ref.current === undefined) return
    if ('chart' in ref.current) {
      (ref.current.chart as Highcharts.Chart).update({
        tooltip: {
          shared: !explodeKeyHeld,
        }
      })
    }
  }, [explodeKeyHeld])

  return(
    <Box
      sx={{
        height: '100%',
        position: 'relative',
      }}
    >
      <HighchartsWrapper
        ref={ref}
        isLoading={!data}
        constructorType={'stockChart'}
        options={{
          navigator: {
            // adaptToUpdatedData: false,
          },
          series: data.chartSeries,
          plotOptions: {
            column: {
              stacking: 'normal',
              crisp: false,
            },
            areaspline: {
              stacking: 'normal',
            },
            spline: {
              //
            },
            series: {
              dataGrouping: {
                enabled: false,
              },
            },
          },
          legend: {
            enabled: true,
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            // floating: true,
          },
          tooltip: {
            valueDecimals: data.mode === "level" ? 0 : 2,
            formatter: data.mode !== "level" && function(this: TooltipPoint, tooltip: Highcharts.Tooltip) {
              return tooltipPercentFormatter(this, tooltip, data.freq)
            },
            split: false,
            shared: true,
            // shared: !explodeKeyHeld,
          },
          scrollbar: {
            enabled: false
          },
          rangeSelector: {
            buttons: [
              {
                type: 'ytd',
                text: 'YTD',
              },
              {
                type: 'year',
                count: 1,
                text: '1Y',
              },
              {
                type: 'year',
                count: 3,
                text: '3Y',
              },
              {
                type: 'year',
                count: 5,
                text: '5Y',
              },
              {
                type: 'year',
                count: 10,
                text: '10Y',
              },
              {
                type: 'all',
                text: 'All',
              },
            ],
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
            crosshair: false,
          },
          yAxis: {
            labels: {
              formatter: data.mode !== "level" && ticksPercentFormatter,
              align: 'left',
            },
            offset: 10,
            plotLines: [{
              color: 'black',
              value: 0,
              width: 2,
              zIndex: 3,
            }],
          },
          credits: {
            enabled: false,
          },
        }}
      />
    </Box>
  )
})

export default ComponentChart