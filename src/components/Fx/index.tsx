import React from "react"
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

const serverAddress = process.env.NODE_ENV === "development"
  ? `http://localhost:1443`
  : `https://data-tracker.api.artt.dev`


const tickersDef = {
  GBPUSD: {
    group: "AE",
    invert: true,
  },
  EURUSD: {
    group: "AE",
    invert: true,
  },
  USDJPY: {
    group: "AE",
    invert: false,
  },
  DXY: {
    group: "AE",
    invert: false,
  },
  USDTHB: {
    group: "EM",
    invert: false,
  },
  USDKRW: {
    group: "EM",
    invert: false,
  },
  USDPHP: {
    group: "EM",
    invert: false,
  },
  USDCNY: {
    group: "EM",
    invert: false,
  },
  USDINR: {
    group: "EM",
    invert: false,
  },
  USDSGD: {
    group: "EM",
    invert: false,
  },
  USDIDR: {
    group: "EM",
    invert: false,
  },
  USDMYR: {
    group: "EM",
    invert: false,
  },
  USDTWD: {
    group: "EM",
    invert: false,
  },
  USDVND: {
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

type Props = {

}

const Fx: React.FC<Props> = () => {

  const [processedData, setProcessedData] = React.useState<{ticks: number[], series: {name: string, data: number[], returns: number[]}[]}>()

  const fetchByTickers = (tickers: string[]) => {
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
        }}
      />
      <HighchartsReact
        highcharts={Highcharts}
        options={{
          chart: {
            type: 'bar',
          },
          series: [{
            data: processedData?.series.map(series => series.returns[0])
          }],
          // allTickers.map(ticker => ({
          //   name: ticker,
          //   data: returns && [returns[ticker][0]],
          // })),
          xAxis: {
            categories: processedData?.series.map(series => series.name)
          },
        }}
      />
    </div>
  )

}

export default Fx