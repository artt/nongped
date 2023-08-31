import React from "react";
import Highcharts from 'highcharts';
import HighchartsStock from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import highchartsMap from "highcharts/modules/map";
import { defaultOptions } from "utils";

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

if (typeof HighchartsStock === "object") {
  HighchartsStock.dateFormats = {
    q: function (timestamp) {
      const date = new Date(timestamp)
      return(Math.floor(date.getUTCMonth() / 3) + 1).toFixed(0);
    }
  }
  HighchartsStock.setOptions({
    lang: {
      thousandsSep: ",",
      numericSymbols: ["k", "M", "B", "T", "P", "E"],
    },
  })
}

interface Props {
  useHighchartsStock: boolean,
  isLoading: boolean,
  options?: object,
  [x: string]: unknown,
}

const HighchartsWrapper = React.forwardRef(({ useHighchartsStock, isLoading, options, ...rest }: Props, ref) => {

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
      highcharts={useHighchartsStock ? HighchartsStock : Highcharts}
      containerProps={{ style: { height: "100%", width: "100%" } }}
      options={chartOptions}
      {...rest}
    />
  )

})

export default HighchartsWrapper