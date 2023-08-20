import React from "react";
import type { TooltipPoint } from "components/HighchartsWrapper";
import HighchartsWrapper, { percentFormatterNumber, ticksPercentFormatter, defaultOptions } from "components/HighchartsWrapper";
import Box from '@mui/material/Box';
import { serverAddress } from "utils";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Switch from "@mui/material/Switch";

type YieldCurvesData = {
  data: number[][],
  name: string,
}[]

const comparisonValues = [
  "1M",
  "3M",
  "6M",
  "1Y",
]

export default function Yield() {

  const [data, setData] = React.useState<YieldCurvesData>()
  const [compareData, setCompareData] = React.useState<YieldCurvesData | null>()
  const [mainDate, setMainDate] = React.useState<Dayjs>(dayjs()) // default to today
  const [compareDate, setCompareDate] = React.useState<Dayjs | null>(null) // default to today
  const [compareValue, setCompareValue] = React.useState<string>("3M")
  const [enableComparison, setEnableComparison] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (compareValue.length === 2) {
      setCompareDate(mainDate.subtract(parseInt(compareValue[0]), compareValue[1] === "M" ? "month" : "year"))
    }
    fetch(`${serverAddress}/yield/${mainDate.format("YYYY-MM-DD")}`)
      .then(res => res.json())
      .then(data => setData(data.reverse()))
  }, [mainDate, compareValue])
  React.useEffect(() => {
    if (!compareDate) setCompareData(null)
    fetch(`${serverAddress}/yield/${compareDate?.format("YYYY-MM-DD")}`)
      .then(res => res.json())
      .then(data => setCompareData(data.reverse()))
  }, [compareDate])

  const customRadio = <Radio size="small" sx={{paddingTop: "6px", paddingBottom: "6px"}} />;

  return (
    <Box sx={{
      width: "100%",
      display: "flex",
      gap: 2,
    }}>
      <HighchartsWrapper
        isLoading={!data}
        options={data && {
          chart: {
            type: 'spline',
          },
          series: data.concat(enableComparison && compareData || []).map((series, i) => ({
            ...series,
            color: defaultOptions.colors[i % 2],
            opacity: i >= 2 ? 0.5 : 1,
            dashStyle: i >= 2 ? 'ShortDash' : undefined,
            showInLegend: i < 2,
          })),
          plotOptions: {
            series: {
              marker: {
                enabled: true,
              },
            },
          },
          tooltip: {
            formatter: function(this: TooltipPoint) {
              const durationLabel = this.x >= 1 ? `${this.x}Y` : `${Math.round(this.x * 12)}M`
              return `<b>${durationLabel}</b><br />${percentFormatterNumber(this.y)}`
            },
          },
          xAxis: {
            title: {
              text: "Time to maturity"
            },
            // type: 'logarithmic',
          },
          yAxis: {
            title: {
              text: "Yield",
            },
            labels: {
              formatter: ticksPercentFormatter,
            },
          },
          title: {
            text: ""
          },
          legend: {
            layout: "vertical",
            floating: true,
            align: "right",
            verticalAlign: "bottom",
            y: -50,
          },
          credits: {
            enabled: false,
          },
        }}
      />
      <Box sx={{
        maxWidth: "160px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        <DatePicker
          format="YYYY-MM-DD"
          disableFuture
          slotProps={{
            textField: {
              size: 'small',
              label: "Date",
            },
            actionBar: { actions: ["today"] },
          }}
          value={mainDate}
          onAccept={(newValue) => {
            if (!newValue) return
            setMainDate(newValue)
          }}
        />
        <FormControl>
        <FormLabel sx={{
          display: "flex",
        }}>
          <Box sx={{flexGrow: 1, display: "flex", alignItems: "center"}}>Comparison</Box>
          <Switch value={enableComparison} onChange={() => setEnableComparison(!enableComparison)} sx={{marginRight: -1}} />
        </FormLabel>
          <RadioGroup
            defaultValue="3M"
            value={compareValue}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setCompareValue((event.target as HTMLInputElement).value);
            }}
          >
            {comparisonValues.map(value => (
              <FormControlLabel
                key={value}
                value={value}
                control={customRadio}
                label={value}
                disabled={!enableComparison}
              />
            ))}
          </RadioGroup>
          <DatePicker
            format="YYYY-MM-DD"
            disableFuture
            slotProps={{
              textField: {
                size: 'small',
              },
              actionBar: { actions: ["cancel"] },
            }}
            value={compareDate}
            onAccept={(newValue) => {
              setCompareDate(newValue)
              setCompareValue("Custom")
            }}
          />
        </FormControl>
      </Box>
    </Box>
  );

}