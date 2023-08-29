import React from "react"
import HighchartsWrapper from "components/HighchartsWrapper"
import type { LabelDefType, ComponentChartDataType, TooltipPoint } from "types"
import Box from "@mui/material/Box"
import { tooltipPercentFormatter, ticksPercentFormatter } from "utils"
import deepmerge from "deepmerge"

interface Props {
  freqList: string[],
  labelDefs: LabelDefType,
  data: ComponentChartDataType,
  handleRangeChange: (minDate: string, maxDate: string) => void,
  override?: {[x: string]: unknown},
}

const TimeSeriesChart = React.memo(({ data, handleRangeChange, override }: Props) => {
  
  const ref = React.useRef<Highcharts.Chart>()

  return(
    <Box sx={{
      height: '100%',
      position: 'relative',
    }}>
      <HighchartsWrapper
        ref={ref}
        isLoading={!data}
        constructorType={'stockChart'}
        options={deepmerge({
          chart: {
            // type: 'spline',
          },
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
              // marker: {
              //   enabled: true,
              //   fillColor: 'white',
              //   lineColor: null,
              //   lineWidth: 2,
              //   radius: 4,
              // },
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
            }]
          },
          credits: {
            enabled: false,
          },
        }, override || {})}
      />
    </Box>
  )
})

export default TimeSeriesChart