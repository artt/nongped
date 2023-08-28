import type { NeerData } from "types"
import HighchartsWrapper from "components/HighchartsWrapper";
import { percentFormatter, ticksPercentFormatter } from "utils";

interface Props {
  data?: NeerData,
}

export default function Neer({ data }: Props) {
  return (
    <HighchartsWrapper
      isLoading={!data}
      options={data && {
        chart: {
          type: 'column',
        },
        series: [{
          name: 'Returns',
          data: data.returns,
          dataLabels: {
            enabled: true,
            formatter: percentFormatter,
          },
        }],
        tooltip: {
          enabled: false,
          // formatter: percentFormatter,
        },
        xAxis: {
          categories: data.periods,
        },
        yAxis: {
          title: {
            text: "Returns",
          },
          labels: {
            formatter: ticksPercentFormatter,
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