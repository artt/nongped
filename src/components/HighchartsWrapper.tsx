import React from "react";
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import deepmerge from "deepmerge"
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

interface Props {
  isLoading: boolean,
  staticOptions: object,
  dynamicOptions: object,
  [x: string]: unknown,
}

const HighchartsWrapper = React.forwardRef(({ isLoading, staticOptions, dynamicOptions, ...rest }: Props, ref) => {

  const [chartOptions, setChartOptions] = React.useState<object>(deepmerge(defaultOptions, staticOptions))

  React.useEffect(() => {
    setChartOptions(dynamicOptions)
  }, [dynamicOptions])

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
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%", width: "100%" } }}
      options={chartOptions}
      {...rest}
    />
  )

})

export default HighchartsWrapper