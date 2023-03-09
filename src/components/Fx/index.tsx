import React from "react"
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

import styles from "./styles.module.scss"

const serverAddress = process.env.NODE_ENV === "development"
  ? `http://localhost:1443`
  : `https://data-tracker.api.artt.dev`

const curYear = new Date().getFullYear()

function calculateAverage(data: number[]) {
  return data.reduce((a, b) => a + b, 0) / data.length
}

const tickersDef: {[x: string]: any} = {
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

const graphTickers = ["USDTHB"]

function getIndexOfTimestamp(ticks: number[], timestamp: number, goBackIfNotFoundExactly: boolean) {
  const tmp = ticks.findIndex(t => t > timestamp)
  if (tmp === -1)
    return ticks.length - 1
  if (ticks[tmp - 1] === timestamp)
    return tmp - 1
  return goBackIfNotFoundExactly ? tmp - 1 : tmp
}

function ticksPercentFormatter(this: {value:number}): string {
  return `${(this.value * 100).toFixed(0)}%`
}

function percentFormatter(this: {y: number}): string {
  return `${(this.y * 100).toFixed(2)}%`
}

type ProcessedData = {
  ticks: number[],
  series: {
    name: string,
    data: number[],
    yearlyReturns: number[]
    yearlyVolatility: number[]
  }[]
}

export default function Fx() {

  const [processedData, setProcessedData] = React.useState<ProcessedData>()

  function getSeriesByGroup(group: string) {
    return processedData?.series.filter(x => tickersDef[x.name].group === group)
  }

  function fetchByTickers(tickers: string[]) {
    return fetch(`${serverAddress}/fx`, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "start": Date.UTC(2020, 6, 1),
        "end": Date.now(),
        "tickers": tickers,
      })
    }).then(res => res.json())
  }

  React.useEffect(() => {
    const fetchAllData = async () => {
      const allTickers = Object.keys(tickersDef)
      return Promise.all([
        fetchByTickers(allTickers.slice(0, 5)),
        fetchByTickers(allTickers.slice(5)),
      ])
    }
    fetchAllData()
      .then(res => {

        // combine the two responses
        // should be the same, but just to make sure
        const numTicks = Math.min(...res.map(r => r.ticks.length))
        const ticks = res[0].ticks.slice(0, numTicks)


        // calculate EOY dates
        // let eoyTimestamps: number[] = []
        // for (let i = -3; i <= 0; i ++) {
        //   eoyTimestamps.push(getIndexOfTimestamp(ticks, Date.UTC(curYear + i, 11, 31)))
        // }

        const firstOfYearIndices = [-2, -1, 0].map(i => getIndexOfTimestamp(ticks, Date.UTC(curYear + i, 0, 1), false))
        // add in returns and volatility into the data
        const tmp = res.map(responseChunk => {
          return(responseChunk.data.map((series: {data: number[], name: string}) => {
            // for each series...

            // yearly returns
            const p = series.name === "DXY" ? 1 : -1
            const yearlyReturns = [0, 1, 2].map(i => (series.data[(firstOfYearIndices[i + 1] - 1) || (series.data.length - 1)] / series.data[firstOfYearIndices[i] - 1])**p - 1)

            // calculate EWMA volatility
            const weight = 0.06
            const beginIndex = getIndexOfTimestamp(ticks, Date.UTC(2021, 0, 4), true)
            // TODO: need to get first volatility for each series
            const beginVol = Math.sqrt(0.0001217)
            let vol = Array(ticks.length).fill(NaN)
            vol[beginIndex] = beginVol
            for (let i = beginIndex + 1; i < ticks.length; i ++) {
              const tmpReturn = Math.log(series.data[i - 1] / series.data[i])
              vol[i] = Math.sqrt((1 - weight) * vol[i - 1]**2 + weight * (isFinite(tmpReturn) ? tmpReturn : 0)**2)
            }
            const yearlyVolatility = [0, 1, 2].map(i => calculateAverage(vol.slice(firstOfYearIndices[i], firstOfYearIndices[i + 1]).filter(x => !Number.isNaN(x))))
            if (series.name === "DXY") {
              console.log(series.data)
              console.log(vol)
            }

            return({
              ...series,
              yearlyVolatility: yearlyVolatility.map(v => v * Math.sqrt(252)).reverse(), // annualized volatility
              yearlyReturns: yearlyReturns.reverse(), // reverse so that the most recent year is first
            })

          }))
        }).flat()

        setProcessedData({
          ticks: ticks,
          series: tmp,
        })
        
      })
  }, [])

  interface ComparisonProps {
    yearOffset: number,
    whatToCompare: "yearlyReturns" | "yearlyVolatility",
  }

  function Comparison({ yearOffset, whatToCompare }: ComparisonProps) {
    return(
      <HighchartsReact
        highcharts={Highcharts}
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
            dataLabels: {
              enabled: true,
              formatter: percentFormatter,
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

  return(
    <>
      <div className={styles.timeSeriesContainer}>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={{
            series: processedData?.series
              .filter(series => graphTickers.includes(series.name))
              .map(series => ({
                name: series.name,
                data: series.data.map((p, i) => [processedData.ticks[i], p])
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
      </div>
      <div className={styles.comparisonContainer}>
        <div className={styles.flexContainer}>
          <Comparison yearOffset={2} whatToCompare="yearlyReturns" />
          <Comparison yearOffset={1} whatToCompare="yearlyReturns" />
          <Comparison yearOffset={0} whatToCompare="yearlyReturns" />
          <Comparison yearOffset={2} whatToCompare="yearlyVolatility" />
          <Comparison yearOffset={1} whatToCompare="yearlyVolatility" />
          <Comparison yearOffset={0} whatToCompare="yearlyVolatility" />
        </div>
      </div>
    </>
  )

}
