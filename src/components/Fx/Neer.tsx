import type { NeerData } from "./index"
import HighchartsWrapper from "components/HighchartsWrapper";
import { percentFormatter } from "utils";

interface Props {
  data?: NeerData,
  curYear: number,
}

export default function Neer({ data, curYear }: Props) {
  return (
    <HighchartsWrapper
      isLoading={!data}
      options={data && {
        chart: {
          type: 'column',
        },
        series: [{
          name: 'Returns',
          data: data.yearlyReturns,
          dataLabels: {
            enabled: true,
            formatter: percentFormatter,
          },
        }],
        xAxis: {
          categories: Array.from(Array(data.yearlyReturns.length).keys()).reverse().map(i => curYear - i + (i === 0 ? " (YTD)" : "")),
        },
        yAxis: {
          title: {
            text: "Returns",
          },
        },
        title: {
          text: ""
        },
        legend: {
          enabled: false,
        },
        credits: {
          enabled: false,
        },
      }}
    />
  );
}