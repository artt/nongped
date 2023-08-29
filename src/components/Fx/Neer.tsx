import type { NeerData } from "types"
import HighchartsWrapper from "components/HighchartsWrapper";
import { dataLabelsPercentFormatter, ticksPercentFormatter } from "utils";

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
            formatter: dataLabelsPercentFormatter,
          },
        }],
        tooltip: {
          enabled: false,
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