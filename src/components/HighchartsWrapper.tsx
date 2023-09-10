import React from "react";
import Highcharts from 'highcharts';
import HighchartsStock from 'highcharts/highstock';
import HighchartsMap from 'highcharts/highmaps';
import HighchartsReact, { HighchartsReactRefObject } from 'highcharts-react-official';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { defaultOptions } from "utils";

type HighchartsConstructorType = "chart" | "stockChart" | "mapChart"

if (document) {
  [Highcharts, HighchartsStock, HighchartsMap].forEach((Highcharts) => {
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
  })
}

const constructor: Record<HighchartsConstructorType, unknown> = {
  chart: Highcharts,
  stockChart: HighchartsStock,
  mapChart: HighchartsMap,
}

interface Props {
  constructorType: HighchartsConstructorType,
  isLoading: boolean,
  options?: object,
  [x: string]: unknown,
}

const HighchartsWrapper = React.forwardRef<HighchartsReactRefObject, Props>(({ constructorType="chart", isLoading=false, options, ...rest }: Props, ref) => {

  // use state (instead of props) so to minimize rerenderings
  // https://github.com/highcharts/highcharts-react#optimal-way-to-update
  const [chartOptions, setChartOptions] = React.useState<object>(defaultOptions)

  React.useEffect(() => {
    if (options)
      setChartOptions(options)
  }, [options])

  if (isLoading) {
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
  }

  return(
    <HighchartsReact
      ref={ref}
      highcharts={constructor[constructorType]}
      constructorType={constructorType}
      containerProps={{ style: { height: "100%", width: "100%" } }}
      options={chartOptions}
      {...rest}
    />
  )

})

export default HighchartsWrapper