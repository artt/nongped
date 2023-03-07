import React from "react"
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

const serverAddress = process.env.NODE_ENV === "development"
  ? `http://localhost:1443`
  : `https://data-tracker.api.artt.dev`


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
    group: "AE",
    invert: false,
  },
  DXY: {
    label: "DXY",
    group: "AE",
    invert: false,
  },
  USDTHB: {
    label: "THB",
    group: "EM",
    invert: false,
  },
  USDKRW: {
    label: "KRW",
    group: "EM",
    invert: false,
  },
  USDPHP: {
    label: "PHP",
    group: "EM",
    invert: false,
  },
  USDCNY: {
    label: "CNY",
    group: "EM",
    invert: false,
  },
  USDINR: {
    label: "INR",
    group: "EM",
    invert: false,
  },
  USDSGD: {
    label: "SGD",
    group: "EM",
    invert: false,
  },
  USDIDR: {
    label: "IDR",
    group: "EM",
    invert: false,
  },
  USDMYR: {
    label: "MYR",
    group: "EM",
    invert: false,
  },
  USDTWD: {
    label: "TWD",
    group: "EM",
    invert: false,
  },
  USDVND: {
    label: "VND",
    group: "EM",
    invert: false,
  },
}

const graphTickers = ["USDTHB"]

function getIndexOfTimestamp(ticks: number[], timestamp: number) {
  const tmp = ticks.findIndex(t => t > timestamp)
  if (tmp === -1) {
    return ticks.length - 1
  }
  return tmp - 1
}

function percentFormatter(this: {y: number}): string {
  return `${(this.y * 100).toFixed(2)}%`
}

export default function Fx() {

  const [processedData, setProcessedData] = React.useState<{ticks: number[], series: {name: string, data: number[], returns: number[]}[]}>()

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
        const curYear = new Date().getFullYear()
        let eoyTimestamps: number[] = []
        for (let i = -3; i <= 0; i ++) {
          eoyTimestamps.push(getIndexOfTimestamp(ticks, Date.UTC(curYear + i, 11, 31)))
        }

        // add in returns array into the data
        const tmp = res.map(responseChunk => {
          return(responseChunk.data.map((series: {data: number[], name: string}) => {
            const p = series.name === "DXY" ? 1 : -1
            let returns = []
            for (let i = 1; i <= 3; i ++) {
              returns.push((series.data[eoyTimestamps[i]] / series.data[eoyTimestamps[i - 1]])**p - 1)
            }
            return({
              ...series,
              returns: returns,
            })
          }))
        }).flat()

        setProcessedData({
          ticks: ticks,
          series: tmp,
        })
        
      })
  }, [])

  function Comparison() {
    const commonOptions = {
      dataSorting: {
        enabled: true,
      },
      dataLabels: {
        enabled: true,
        formatter: percentFormatter,
      },
    }
    return(
      <HighchartsReact
        highcharts={Highcharts}
        options={{
          chart: {
            type: 'bar',
          },
          credits: {
            enabled: false,
          },
          series: [
            {
              ...commonOptions,
              name: 'AE',
              data: getSeriesByGroup("AE")?.map(series => [tickersDef[series.name].label, series.returns[1]]),
            },
            {
              ...commonOptions,
              name: 'EM',
              data: getSeriesByGroup("EM")?.map(series => [tickersDef[series.name].label, series.returns[1]]),
              xAxis: 1,
            }
          ],
          xAxis: [
            {
              type: 'category',
              height: '28%',
            },
            {
              type: 'category',
              height: '70%',
              top: '30%',
              offset: 0,
            }
          ],
        }}
      />
    )
  }

  return(
    <div>
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
      <Comparison />
    </div>
  )

}
