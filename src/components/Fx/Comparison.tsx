import type { FxData } from "types"
import HighchartsWrapper from "components/HighchartsWrapper";
import { dataLabelsPercentFormatter, defaultOptions, ticksPercentFormatter } from "utils";

type TickerType = {
  label: string,
  group: string,
  invert: boolean,
}

const tickersDef: {[x: string]: TickerType} = {
  GBPUSD: {
    label: "GBP",
    group: "AE",
    invert: true,
  },
  EURUSD: {
    label: "EUR",
    group: "AE",
    invert: true,
  },
  USDJPY: {
    label: "JPY",
    group: "Region",
    invert: false,
  },
  DXY: {
    label: "DXY",
    group: "AE",
    invert: false,
  },
  USDTHB: {
    label: "THB",
    group: "Region",
    invert: false,
  },
  USDKRW: {
    label: "KRW",
    group: "Region",
    invert: false,
  },
  USDPHP: {
    label: "PHP",
    group: "Region",
    invert: false,
  },
  USDCNY: {
    label: "CNY",
    group: "Region",
    invert: false,
  },
  USDINR: {
    label: "INR",
    group: "Region",
    invert: false,
  },
  USDSGD: {
    label: "SGD",
    group: "Region",
    invert: false,
  },
  USDIDR: {
    label: "IDR",
    group: "Region",
    invert: false,
  },
  USDMYR: {
    label: "MYR",
    group: "Region",
    invert: false,
  },
  USDTWD: {
    label: "TWD",
    group: "Region",
    invert: false,
  },
  USDVND: {
    label: "VND",
    group: "Region",
    invert: false,
  },
}

interface Props {
  data?: FxData
  curYear: number,
  yearOffset: number,
  whatToCompare: "yearlyReturns" | "yearlyVolatility",
}

export default function Comparison({ data, curYear, yearOffset, whatToCompare }: Props) {

  function getSeriesByGroup(group: string) {
    return data?.series.filter(x => tickersDef[x.name].group === group)
  }

  return(
    <HighchartsWrapper
      isLoading={!data}
      options={data && {
        chart: {
          type: 'bar',
        },
        series: ["AE", "Region"].map(group => ({
          name: group,
          data: getSeriesByGroup(group)?.map(series => ({
            name: tickersDef[series.name].label,
            y: series[whatToCompare][yearOffset],
            color: series.name === "USDTHB" && defaultOptions.colors[3],
          })),
          dataSorting: {
            enabled: true,
          },
          dataLabels: {
            enabled: true,
            formatter: dataLabelsPercentFormatter,
            // align: 'left',
            // inside: true,
          },
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