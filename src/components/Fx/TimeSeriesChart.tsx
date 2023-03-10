import React from "react";
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import type { ProcessedData } from "./index"

const graphTickers = ["USDTHB"]

interface Props {
  data: ProcessedData
}

export default function TimeSeriesChart({ data }: Props) {
  return (
    <HighchartsReact
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%" } }}
      constructorType={'stockChart'}
      options={{
        series: data.series
          .filter(series => graphTickers.includes(series.name))
          .map(series => ({
            name: series.name,
            data: series.data.map((p, i) => [data.ticks[i], p])
          })),
        scrollbar: {
          enabled: false
        },
        plotOptions: {
          series: {
            // compare: 'percent',
            // showInNavigator: true,
          }
        },
        credits: {
          enabled: false,
        },
      }}
    />
  );
}