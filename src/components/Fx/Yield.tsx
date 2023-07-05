import React from "react";
import type { TooltipPoint } from "components/HighchartsWrapper";
import HighchartsWrapper, { percentFormatterNumber, ticksPercentFormatter } from "components/HighchartsWrapper";
import { serverAddress } from "utils";

type YieldCurvesData = {
  [x: string]: number[][],
}

export default function Yield() {

  const [data, setData] = React.useState<YieldCurvesData>()

  React.useEffect(() => {
    fetch(`${serverAddress}/yield`)
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <HighchartsWrapper
      isLoading={!data}
      options={data && {
        chart: {
          type: 'spline',
        },
        series: data,
        plotOptions: {
          series: {
            marker: {
              enabled: true,
            },
          },
        },
        tooltip: {
          formatter: function(this: TooltipPoint) {
            const durationLabel = this.x >= 1 ? `${this.x}Y` : `${Math.round(this.x * 12)}M`
            return `<b>${durationLabel}</b><br />${percentFormatterNumber(this.y)}`
          },
        },
        xAxis: {
          title: {
            text: "Time to maturity"
          },
          // type: 'logarithmic',
        },
        yAxis: {
          title: {
            text: "Yield",
          },
          labels: {
            formatter: ticksPercentFormatter,
          },
        },
        title: {
          text: ""
        },
        legend: {
          layout: "vertical",
          floating: true,
          align: "right",
          verticalAlign: "bottom",
          y: -50,
        },
        credits: {
          enabled: false,
        },
      }}
    />
  );

}