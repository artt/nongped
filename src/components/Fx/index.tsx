import React from "react"
import Box from "@mui/material/Box"
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FxChart from "./FxChart";
import Comparison from "./Comparison";
import Neer from "./Neer";
import Yield from "./Yield";
import { createTheme } from '@mui/material/styles';
import { serverAddress, curYear, getTedDataPromise } from "utils";
import type { FxData, NeerData } from "types"
import Split from "components/Split";

function calculateAverage(data: number[]) {
  return data.reduce((a, b) => a + b, 0) / data.length
}

function getIndexOfTimestamp(ticks: number[], timestamp: number, goBackIfNotFoundExactly: boolean) {
  const tmp = ticks.findIndex(t => t > timestamp)
  if (tmp === -1)
    return ticks.length - 1
  if (ticks[tmp - 1] === timestamp)
    return tmp - 1
  return goBackIfNotFoundExactly ? tmp - 1 : tmp
}

export default function Fx() {

  const theme = createTheme();

  const [fxData, setFxData] = React.useState<FxData>()
  const [neerData, setNeerData] = React.useState<NeerData>()

  const [tabValue, setTabValue] = React.useState(0);
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel({ children, value, index }: TabPanelProps) {
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
        // TODO: set the same max for the three charts
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
        // TODO: set the same max for the three charts
        <>
          {[2, 1, 0].map(i =>
            <Comparison
              key={i}
              data={fxData}
              curYear={curYear}
              yearOffset={i}
              whatToCompare="yearlyVolatility"
            />
          )}
        </>,
    },
    {
      label: "NEER",
      component: <Neer data={neerData} />,
    },
    {
      label: "Yield Curves",
      component: <Yield />,
    },
    {
      label: "Current Account",
      component: <div>Current Account</div>,
      disabled: true,
    },
    {
      label: "Stability",
      component: <div>Stability</div>,
      disabled: true,
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
        const vol = Array(ticks.length).fill(NaN)
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
    const numPeriods = 6
    const promiseYear = getTedDataPromise(['neer'], 'Y', curYear - numPeriods)
    const promiseLast = getTedDataPromise(['neer'], 'M', curYear - 1)
    Promise.all([promiseYear, promiseLast])
      .then(res => {
        setNeerData({
          periods: Array.from(Array(numPeriods).keys()).map(i => `${curYear - numPeriods + i + 1}${i === numPeriods - 1 ? ' (YTD)' : ''}`),
          returns: Array.from(Array(numPeriods).keys()).map(i => ((res[0].series[0].values[i + 1] || res[1].series[0].values.at(-1)) / res[0].series[0].values[i]) - 1)
        })
      })
  }, [])

  return(
    <Split
      top={
        <FxChart data={fxData} />
      }
      bottom={
        <>
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={tabValue}
            onChange={handleChange}
            sx={{ borderRight: 1, borderColor: 'divider' }}
          >
            {bottomTabs.map((tab, i) => <Tab key={i} label={tab.label} disabled={tab.disabled} />)}
          </Tabs>
          {bottomTabs.map((tab, i) => <TabPanel key={i} value={tabValue} index={i}>{tab.component}</TabPanel>)}
        </>
      }
    />
  )

}
