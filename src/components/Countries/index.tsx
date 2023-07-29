import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import HighchartsWrapper from "components/HighchartsWrapper";
import React from "react"
import { serverAddress } from "utils";

const availableSeries = [
  "reserves",
  "gold",
  "gold_in_reserves",
  "gdp",
  "gdp_per_capita",
  "reserves_to_gdp",
]

type CountryData = {
  name: string,
  y: number,
}

export default function Countries() {

  const [series, setSeries] = React.useState<string>(availableSeries[0])
  const [data, setData] = React.useState<CountryData[]>([])

  React.useEffect(() => {
    fetch(`${serverAddress}/imf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        series: series,
      })
    })
      .then(res => res.json())
      .then(res => {
        const tmp = Object.entries(res).map(([name, y]) => ({ name, y, color: name === "TH" ? "#ff0000" : undefined }))
        setData(tmp as CountryData[])
      })
  }, [series])

  return(
    <div>
      <FormControl size="small">
        <InputLabel>Series</InputLabel>
        <Select
          value={series}
          label="Series"
          onChange={e => setSeries(e.target.value as string)}
        >
          {availableSeries.map(series => (
            <MenuItem key={series} value={series}>{series}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <HighchartsWrapper
        isLoading={!data}
        options={data && {
          chart: {
            type: 'bar',
            height: '40%',
          },
          series: [{
            name: series,
            data: data,
            dataSorting: {
              enabled: true,
            },          
            // dataLabels: {
            //   enabled: true,
            //   formatter: percentFormatter,
            //   align: 'left',
            //   inside: true,
            // },
          }],
          xAxis: {
            type: 'category',
            scrollbar: {
              enabled: true
            },
          },
          yAxis: {
            type: 'logarithmic',
          },
          title: {
            text: "",
          },
          plotOptions: {
            series: {
              enablRegionouseTracking: false,
            },
          },
          // tooltip: {
          //   formatter: percentFormatter,
          // },
          legend: {
            enabled: false,
          },
          credits: {
            enabled: false,
          },
        }}
      />
    </div>
  )

}