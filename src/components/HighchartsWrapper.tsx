import React from "react";
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import Skeleton from '@mui/material/Skeleton';

interface Props {
  isLoading: boolean,
  options: any,
  [x: string]: any,
}

export default function HighchartsWrapper({ isLoading, options, ...rest }: Props) {
  if (isLoading)
    return <Skeleton variant="rounded" animation="wave" sx = {{ height: '100%', width: '100%' }} />
  return(
    <HighchartsReact
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%", width: "100%" } }}
      options={options}
      {...rest}
    />
  )
}