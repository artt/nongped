import React from "react"
import HighchartsWrapper from "components/HighchartsWrapper"
import type { LabelDefType, ComponentChartDataType } from "types"
import Box from "@mui/material/Box"
import { percentFormatter, ticksPercentFormatter } from "utils"
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
  // const [data, setData] = React.useState<ComponentChartDataType>()

  // React.useEffect(() => {
  //   const tmp = deepmerge([], chartData)
  //   const series = tmp.series
  //     .filter(series => !(tmp.showGrowth && !tmp.showContribution) || !labelDefs[series.name].hideInGrowthChart)
  //     .filter(series => !(tmp.showGrowth && tmp.showContribution) || !labelDefs[series.name].hideInContributionChart)
  //     .map((series, i) => ({
  //       name: labelDefs[series.name].label,
  //       color: labelDefs[series.name].color,
  //       zIndex: i === 0 ? 99 : i,
  //       data: series.data.map(p => p.v),
  //       // in contribution mode, only the first series is a line chart
  //       type: tmp.showGrowth && tmp.showContribution && i > 0 ? 'column' : 'spline',
  //       pointStart: Date.parse(tmp.freq === 'Q' ? quarterToMonth(series.data[0].t) : series.data[0].t),
  //       pointIntervalUnit: tmp.freq === 'Y' ? 'year' : 'month',
  //       pointInterval: tmp.freq === 'Q' ? 3 : 1,
  //     }))
  //   setData(series)
  // }, [chartData, labelDefs])

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
            valueDecimals: 2,
            valueSuffix: data.showGrowth && '%',
            formatter: data.showGrowth && percentFormatter,
            // split: true,
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
              formatter: data.showGrowth && ticksPercentFormatter,
            },
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