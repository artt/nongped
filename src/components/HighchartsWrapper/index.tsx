import React from "react";
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import merge from "deepmerge"
import highchartsMap from "highcharts/modules/map";
import { defaultOptions } from "./common";


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
  options: unknown,
  [x: string]: unknown,
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
      options={merge(defaultOptions, (options as {[x: string]: unknown}))}
      {...rest}
    />
  )
})

export default HighchartsWrapper