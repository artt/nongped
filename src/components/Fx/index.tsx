import React from "react"
import Box from "@mui/material/Box"
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TimeSeriesChart from "./TimeSeriesChart";
import Comparison from "./Comparison";
import Neer from "./Neer";
import Yield from "./Yield";
import { createTheme } from '@mui/material/styles';
import { serverAddress, curYear } from "utils";

function calculateAverage(data: number[]) {
  return data.reduce((a, b) => a + b, 0) / data.length
}

export const tickersDef: {[x: string]: any} = {
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

function getIndexOfTimestamp(ticks: number[], timestamp: number, goBackIfNotFoundExactly: boolean) {
  const tmp = ticks.findIndex(t => t > timestamp)
  if (tmp === -1)
    return ticks.length - 1
  if (ticks[tmp - 1] === timestamp)
    return tmp - 1
  return goBackIfNotFoundExactly ? tmp - 1 : tmp
}

export type FxData = {
  ticks: number[],
  series: {
    name: string,
    data: number[],
    yearlyReturns: number[]
    yearlyVolatility: number[]
  }[]
}

export type NeerData = {
  data: {
    t: string,
    v: number,
  }[],
  yearlyReturns: number[]
}

export default function Fx() {

  const theme = createTheme();

  const [fxData, setFxData] = React.useState<FxData>()
  const [neerData, setNeerData] = React.useState<NeerData>()

  const [tabValue, setTabValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    if (value !== index)
      return null
    return (
      <Box role="tabpanel" hidden={value !== index} sx={{
        pl: 3,
        height: '100%',
        flex: '1 1 auto',
        display: 'flex',
        gap: theme.spacing(2)
      }}>
        {children}
      </Box>
    );
  }

  const bottomTabs = [
    {
      label: "Returns",
      component:
        <>
          {[2, 1, 0].map(i =>
            <Comparison
              key={i}
              data={fxData}
              curYear={curYear}
              yearOffset={i}
              whatToCompare="yearlyReturns"
            />)}
        </>,
    },
    {
      label: "Volatility",
      component:
        <>
          {[2, 1, 0].map(i =>
            <Comparison key={i}
            data={fxData}
            curYear={curYear}
            yearOffset={i}
            whatToCompare="yearlyVolatility"
          />)}
        </>,
    },
    {
      label: "NEER",
      component: <Neer data={neerData} curYear={curYear} />,
    },
    {
      label: "Yield Curves",
      component: <Yield />,
    },
    {
      label: "Current Account",
      component: <div>Current Account</div>,
    },
    {
      label: "Stability",
      component: <div>Stability</div>,
    },
  ]

  React.useEffect(() => {
    fetch(`${serverAddress}/fx`)
    .then(res => res.json())
    .then(res => {

      const ticks = res.ticks

      const firstOfYearIndices = [-2, -1, 0].map(i => getIndexOfTimestamp(ticks, Date.UTC(curYear + i, 0, 1), false))
      // add in returns and volatility into the data
      const tmp = res.data.map((series: {data: number[], name: string}) => {

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

        return({
          ...series,
          yearlyVolatility: yearlyVolatility.map(v => v * Math.sqrt(252)).reverse(), // annualized volatility
          yearlyReturns: yearlyReturns.reverse(), // reverse so that the most recent year is first
        })

      })

      setFxData({
        ticks: ticks,
        series: tmp,
      })
      
    })
  }, [])

  // fetching and processing NEER data
  React.useEffect(() => {
    fetch(`${serverAddress}/neer`)
      .then(res => res.json())
      .then(res => {
        const firstIndex = res.findIndex((x: any) => x.t === `${curYear - 6}-12`)
        const yearlyReturns = [0, 1, 2, 3, 4, 5].map(i => ((res[firstIndex + (12 * (i + 1))] || res[res.length - 1]).v / res[firstIndex + (12 * i)].v) - 1)
        setNeerData({
          data: res,
          yearlyReturns: yearlyReturns.reverse(),
        })
      })
  }, [])

  return(
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
    }}>
      
      {/* Top box for time series chart */}
      <Box sx={{ flex: '1 1 50%' }}>
        <TimeSeriesChart data={fxData} />
      </Box>

      {/* Bottom box for additional information */}
      <Box sx={{ flex: '1 1 50%', display: 'flex' }}>
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={tabValue}
          onChange={handleChange}
          sx={{ borderRight: 1, borderColor: 'divider' }}
        >
          {bottomTabs.map((tab, i) => <Tab key={i} label={tab.label} />)}
        </Tabs>
        {bottomTabs.map((tab, i) => <TabPanel key={i} value={tabValue} index={i}>{tab.component}</TabPanel>)}
      </Box>

    </Box>
  )

}
