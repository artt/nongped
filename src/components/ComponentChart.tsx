import React from "react"
import HighchartsWrapper from "components/HighchartsWrapper"
import type { LabelDefType, ProcessedDataType, ComponentChartDataType } from "types"
import Box from "@mui/material/Box"
import { quarterToMonth, percentFormatter, ticksPercentFormatter } from "utils"
import deepmerge from "deepmerge"

interface Props {
  freqList: string[],
  labelDefs: LabelDefType,
  chartData: ProcessedDataType,
  handleRangeChange: (minDate: string, maxDate: string) => void,
}

const TimeSeriesChart = React.memo(({ chartData, labelDefs, handleRangeChange }: Props) => {
  
  const ref = React.useRef<Highcharts.Chart>()
  const [data, setData] = React.useState<ComponentChartDataType>()

  React.useEffect(() => {
    const tmp = deepmerge([], chartData)
    const series = tmp.series
      .filter(series => !(tmp.showGrowth && !tmp.showContribution) || !labelDefs[series.name].hideInGrowthChart)
      .filter(series => !(tmp.showGrowth && tmp.showContribution) || !labelDefs[series.name].hideInContributionChart)
      .map((series, i) => ({
        name: labelDefs[series.name].label,
        color: labelDefs[series.name].color,
        zIndex: i === 0 ? 99 : i,
        data: series.data.map(p => p.v),
        type: tmp.showGrowth && tmp.showContribution && !series.name.startsWith('gd') ? 'column' : 'spline',
        pointStart: Date.parse(tmp.freq === 'Q' ? quarterToMonth(series.data[0].t) : series.data[0].t),
        pointIntervalUnit: tmp.freq === 'Y' ? 'year' : 'month',
        pointInterval: tmp.freq === 'Q' ? 3 : 1,
      }))
    // if (tmp.showContribution && tmp.showGrowth) {
    //   tmp.series.forEach((_, i) => {
    //     if (i > 0) series[i].type = 'column'
    //   })
    // }
    setData(series)
  }, [chartData, labelDefs])

  return(
    <Box sx={{
      height: '100%',
      position: 'relative',
    }}>
      <HighchartsWrapper
        ref={ref}
        isLoading={!data}
        constructorType={'stockChart'}
        options={data && {
          chart: {
            // type: 'spline',
          },
          navigator: {
            // adaptToUpdatedData: false,
          },
          series: data,
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
            floating: true,
          },
          tooltip: {
            valueDecimals: 2,
            valueSuffix: chartData.showGrowth && '%',
            formatter: chartData.showGrowth && percentFormatter,
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
              format: chartData.freq === 'Q' && '{value:%YQ%q}',
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
              formatter: chartData.showGrowth && ticksPercentFormatter,
            },
          },
          credits: {
            enabled: false,
          },
        }}
      />
    </Box>
  )
})

export default TimeSeriesChart