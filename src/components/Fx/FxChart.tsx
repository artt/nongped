import type { FxData } from "types"
import HighchartsWrapper from "components/HighchartsWrapper";

const graphTickers = ["USDTHB"]

interface Props {
  data?: FxData
}

export default function TimeSeriesChart({ data }: Props) {
  return (
    <HighchartsWrapper
      isLoading={!data}
      constructorType={'stockChart'}
      options={data && {
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