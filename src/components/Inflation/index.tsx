import Box from "@mui/material/Box"
import HighchartsWrapper from "components/HighchartsWrapper"
import React from "react"
import { curYear, serverAddress } from "utils"

type InflationData = {
  name: string,
  data: {
    t: string,
    v: number,
  }[]
}[]

export default function Inflation() {

  const [data, setData] = React.useState<InflationData>()

  React.useEffect(() => {
    fetch(`${serverAddress}/inflation`)
      .then(res => res.json())
      .then(res => setData(res))
  }, [])

  console.log(data)

  return (
    <Box sx={{ flex: '1 1 100%' }}>
      <HighchartsWrapper
        isLoading={!data}
        constructorType={'stockChart'}
        options={data && {
          series: data
            .map(series => ({
              name: series.name,
              data: series.data.map((p, i) => p.v),
              pointStart: Date.UTC(curYear - 6, 0, 1),
              pointIntervalUnit: 'month',
            })),
          scrollbar: {
            enabled: false
          },
          xAxis: {
            type: 'datetime',
          },
          credits: {
            enabled: false,
          },
        }}
      />
    </Box>
  )
}
