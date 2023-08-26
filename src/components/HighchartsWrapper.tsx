import React from "react";
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import merge from "deepmerge"
import highchartsMap from "highcharts/modules/map";


if (typeof Highcharts === "object") {
  highchartsMap(Highcharts)
  Highcharts.dateFormats = {
    q: function (timestamp) {
      const date = new Date(timestamp)
      return(Math.floor(date.getUTCMonth() / 3) + 1).toFixed(0);
    }
  }
  Highcharts.setOptions({
    lang: {
      thousandsSep: ",",
      numericSymbols: ["k", "M", "B", "T", "P", "E"],
    },
  })
}

interface Props {
  isLoading: boolean,
  options: any,
  [x: string]: any,
}

export const defaultOptions = {
  colors: [
    '#3f708c',
    '#f7af1c',
    '#2ca02c',  // cooked asparagus green
    '#d62728',  // brick red
    '#9467bd',  // muted purple
    '#8c564b',  // chestnut brown
    '#e377c2',  // raspberry yogurt pink
    '#7f7f7f',  // middle gray
    '#bcbd22',  // curry yellow-green
    '#17becf',  // blue-teal
  ],
  title: {
    text: "",
  },
  credits: {
    enabled: false,
  },
  plotOptions: {
    series: {
      lineWidth: 2,
    },
  },
  chart: {
    backgroundColor: 'transparent',
  },
}

export function ticksPercentFormatter(this: {value:number}, _o: object, dontMultiply = false): string {
  return `${(this.value * (dontMultiply ? 1 : 100)).toFixed(0)}%`
}

export type Point = {
  series: {name: string},
  y: number,
}
export type TooltipPoint = {
  x: number,
  y: number,
  point?: Point,
  points?: Point[],
}
export function percentFormatterNumber(y: number, dontMultiply = false): string {
  return `${(y * (dontMultiply ? 1 : 100)).toFixed(2)}%`
}
export function percentFormatter(this: TooltipPoint, _o: object, dontMultiply = false): string {
  if ('points' in this) {
    return this.points!.map(point => `${point.series.name}: <b>${(point.y * (dontMultiply ? 1 : 100)).toFixed(2)}%</b>`).join('<br/>')
  }
  return percentFormatterNumber(this.y, dontMultiply)
}

const HighchartsWrapper = React.forwardRef(({ isLoading, options, ...rest }: Props, ref) => {
  if (isLoading)
    return(
      <Box sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <CircularProgress />
      </Box>
    )
  return(
    <HighchartsReact
      ref={ref}
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%", width: "100%" } }}
      options={merge(defaultOptions, options)}
      {...rest}
    />
  )
})

export default HighchartsWrapper