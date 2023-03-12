import React from "react";
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface Props {
  isLoading: boolean,
  options: any,
  [x: string]: any,
}

export default function HighchartsWrapper({ isLoading, options, ...rest }: Props) {
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
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%", width: "100%" } }}
      options={options}
      {...rest}
    />
  )
}