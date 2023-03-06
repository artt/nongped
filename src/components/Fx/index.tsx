import React from "react"
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

const serverAddress = process.env.NODE_ENV === "development"
  ? `http://localhost:1443`
  : `https://data-tracker.api.artt.dev`

const inverseList = ["GBPUSD", "EURUSD"]
const aeTickers = ["GBPUSD", "EURUSD", "USDJPY", "DXY", "USDTHB"]
const emTickers = ["USDKRW", "USDPHP", "USDCNY", "USDINR", "USDSGD", "USDIDR", "USDMYR", "USDTWD", "USDVND"]
const allTickers = [...aeTickers, ...emTickers]

const graphTickers = ["USDTHB"]

function getIndexOfTimestamp(ticks: number[], timestamp: number) {
  const tmp = ticks.findIndex(t => t > timestamp)
  if (tmp === -1) {
    return ticks.length - 1
  }
  return tmp - 1
}

function calculateYearlyReturns(year: number, ticks: number[], series: number[]) {
  const prevYearIndex = getIndexOfTimestamp(ticks, Date.UTC(year-1, 11, 31))
  const curYearIndex = getIndexOfTimestamp(ticks, Date.UTC(year, 11, 31))
  return (series[curYearIndex] / series[prevYearIndex]) - 1
}

type Props = {

}

const Fx: React.FC<Props> = () => {

  const [processedData, setProcessedData] = React.useState<{ticks: number[], series: {[x: string]: number[]}}>()
  const [returns, setReturns] = React.useState<{[x: string]: number[]}>()

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
      return Promise.all([
        fetchByTickers(aeTickers),
        fetchByTickers(emTickers),
      ])
    }
    fetchAllData()
      .then(res => {
        // combine the two responses
        // should be the same, but just to make sure
        const numTicks = Math.min(...res.map(r => r.ticks.length))
        const tmp = res.map(r => r.data)
          .flat()
          .reduce((a, b) => ({
            ...a,
            [b.name]: b.data.slice(0, numTicks).map((p: number) => inverseList.includes(b.name) ? 1/p : p)
          }), {})
        setProcessedData({
          ticks: res[0].ticks.slice(0, numTicks),
          series: tmp,
        })
      })
  }, [])

  React.useEffect(() => {
    if (!processedData)
      return
    const curYear = new Date().getFullYear()
    let tmp: {[x: string]: any} = {}
    for (let i = -2; i <= 0; i ++) {
      const year = curYear + i
      tmp[year] = {}
      // calculate returns for year curYear - i
      const prevYearIndex = getIndexOfTimestamp(processedData.ticks, Date.UTC(year - 1, 11, 31))
      const curYearIndex = getIndexOfTimestamp(processedData.ticks, Date.UTC(year, 11, 31))
      allTickers.forEach(ticker => {
        const p = ticker === "DXY" ? 1 : -1
        tmp[year][ticker] = (processedData.series[ticker][curYearIndex] / processedData.series[ticker][prevYearIndex])**p - 1
      })
    }
    setReturns(tmp)
  }, [processedData])

  return(
    <HighchartsReact
      highcharts={Highcharts}
      constructorType={'stockChart'}
      options={{
        series: graphTickers.map((ticker: string) => ({
          name: ticker,
          data: processedData?.series[ticker].map((p, i) => [processedData.ticks[i], p])
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
  )

}

export default Fx