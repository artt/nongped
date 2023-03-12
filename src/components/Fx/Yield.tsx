import React from "react";
import HighchartsWrapper from "components/HighchartsWrapper";
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