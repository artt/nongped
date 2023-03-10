import React from "react";
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { tickersDef } from "./index"
import type { ProcessedData } from "./index"
import Skeleton from '@mui/material/Skeleton';

function ticksPercentFormatter(this: {value:number}): string {
  return `${(this.value * 100).toFixed(0)}%`
}

// function percentFormatter(this: {y: number}): string {
//   return `${(this.y * 100).toFixed(2)}%`
// }

interface Props {
  data?: ProcessedData
  curYear: number,
  yearOffset: number,
  whatToCompare: "yearlyReturns" | "yearlyVolatility",
}

export default function Comparison({ data, curYear, yearOffset, whatToCompare }: Props) {

  function getSeriesByGroup(group: string) {
    return data!.series.filter(x => tickersDef[x.name].group === group)
  }

  if (!data)
    return <Skeleton variant="rounded" animation="wave" sx = {{ height: '100%', width: '100%' }} />

  return(
    <HighchartsReact
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%", width: "100%" } }}
      options={{
        chart: {
          type: 'bar',
        },
        series: ["AE", "Region"].map(group => ({
          name: group,
          data: getSeriesByGroup(group)?.map(series => ({
            name: tickersDef[series.name].label,
            y: series[whatToCompare][yearOffset],
            color: series.name === "USDTHB" && "coral",
          })),
          dataSorting: {
            enabled: true,
          },
          // dataLabels: {
          //   enabled: true,
          //   formatter: percentFormatter,
          //   align: 'left',
          //   inside: true,
          // },
          xAxis: group === "AE" ? 0 : 1,
        })),
        xAxis: [
          {
            type: 'category',
            height: '21%',
          },
          {
            type: 'category',
            height: '77%',
            top: '23%',
            offset: 0,
          }
        ],
        yAxis: {
          title: {
            text: `${curYear - yearOffset} ${whatToCompare.replace('yearly', '')}` + (yearOffset === 0 ? " (YTD)" : ""),
          },
          labels: {
            formatter: ticksPercentFormatter,
          },
        },
        title: {
          text: "",
        },
        plotOptions: {
          series: {
            enablRegionouseTracking: false,
          },
        },
        legend: {
          enabled: false,
        },
        credits: {
          enabled: false,
        },
      }}
    />
  )
}