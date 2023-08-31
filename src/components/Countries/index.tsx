import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import HighchartsWrapper from "components/HighchartsWrapper";
import React from "react"
import { serverAddress, customLocaleString } from "utils";
import worldMap from "@highcharts/map-collection/custom/world.topo.json";
import MapIcon from '@mui/icons-material/Map';
import BarChartIcon from '@mui/icons-material/BarChart';
import Highcharts from "highcharts";

// TODO: should add Hong Kong to worldMap later
function getCountryName(code: string) {
  if (code === "HK") return "Hong Kong"
  return worldMap.objects.default.geometries.find((g: {id: string}) => g.id === code)?.properties.name || code
}

// for now do this here
// might be better to move this to a spreadsheet in the future if the list gets longer
// https://www.imf.org/external/datamapper/api/v1/indicators
type Series = {
  label: string,
  multiplier: number,
  unit: string,
}

const availableSeries: {[x: string]: Series} = {
  reserves: {
    label: "Foreign reserves",
    multiplier: 1e6,
    unit: "USD",
  },
  gold: {
    label: "Gold in reserves",
    multiplier: 1e6,
    unit: "USD",
  },
  gold_in_reserves: {
    label: "Portion of reserves in gold",
    multiplier: 100,
    unit: "%",
  },
  gdp: {
    label: "GDP",
    multiplier: 1e9,
    unit: "USD",
  },
  gdp_per_capita: {
    label: "GDP per capita (PPP)",
    multiplier: 1,
    unit: "PPP USD",
  },
  reserves_to_gdp: {
    label: "Reserves to GDP ratio",
    multiplier: 100,
    unit: "%",
  },
}

const groups: {[x: string]: string[]} = {
  World: [],
  ASEAN: ["ID", "MY", "PH", "SG", "TH", "VN", "BN", "KH", "LA", "MM"],
  G20: ["AR", "AU", "BR", "CA", "CN", "FR", "DE", "IN", "ID", "IT", "JP", "MX", "RU", "SA", "ZA", "KR", "TR", "GB", "US"],
  "Top 20": [],
}

type CountryData = {
  name: string,
  y: number,
  color?: string,
  rank: number,
}

interface CustomPoint extends Highcharts.Point {
  rank: number;
}

interface ChartProps {
  data: CountryData[],
  useLogScale: boolean,
  series: string,
}

const Map = ({ data, useLogScale, series }: ChartProps) => <HighchartsWrapper
  isLoading={!data}
  constructorType={"mapChart"}
  options={data && {
    chart: {
      type: 'map',
    },
    colorAxis: {
      stops: [
        [0, '#d7191c'],
        [0.5, '#ffffbf'],
        [1, '#2c7bb6'],
      ],
      type: useLogScale ? "logarithmic" : "linear",
    },
    series: [{
      name: availableSeries[series].label,
      data: data.filter(x => !useLogScale || x.y > 0).map(d => ({name: d.name, rank: d.rank, value: d.y, y: d.y})),
      mapData: worldMap,
      // allAreas: true,
      joinBy: ["iso-a2", "name"],
    }],
    mapView: {
      projection: {
        name: "Miller",
      },
    },
    tooltip: {
      formatter: function(this: Highcharts.TooltipFormatterContextObject, tooltip: Highcharts.Tooltip) {
        const tmp = (tooltip.defaultFormatter.call(this, tooltip) as string[])
        const point = this.point as CustomPoint
        tmp[1] = tmp[1]
          .replace(/: .*<br\/>/, `: <b>${customLocaleString(point.y)}${availableSeries[series].unit === "%" ? "%" : ` ${availableSeries[series].unit}`}</b><br/>`)
        tmp[2] = `Rank: ${point.rank}`
        return tmp
      },
    },
  }}
/>

const Bar = ({ data, useLogScale, series }: ChartProps) => <HighchartsWrapper
  isLoading={!data}
  options={data && {
    chart: {
      type: 'column',
      zooming: {
        type: 'x',
      },
    },
    series: [{
      name: availableSeries[series].label,
      data: data,
      dataSorting: {
        // don't really need this but it animates stuff
        enabled: true,
      },
    }],
    xAxis: {
      type: 'category',
      scrollbar: {
        // enabled: true
      },
      labels: {
        step: 1,
        rotation: -90,
      },
    },
    legend: {
      enabled: false,
    },
    yAxis: {
      type: useLogScale ? 'logarithmic' : 'linear',
      title: {
        text: `${availableSeries[series].label} (${availableSeries[series].unit})`,
      }
    },
    tooltip: {
      formatter: function(this: Highcharts.TooltipFormatterContextObject, tooltip: Highcharts.Tooltip) {
        const tmp = (tooltip.defaultFormatter.call(this, tooltip) as string[])
        const point = this.point as CustomPoint;
        tmp[0] = tmp[0].replace(point.name, availableSeries[series].label)
        tmp[1] = tmp[1]
          .replace(availableSeries[series].label, getCountryName(point.name))
          .replace(/<b>.*<\/b>/, `<b>${customLocaleString(point.y)}${availableSeries[series].unit === "%" ? "%" : ` ${availableSeries[series].unit}`}</b>`)
        tmp[2] = `Rank: ${point.rank}`
        return tmp
      },
    },
    plotOptions: {
      series: {
        enablRegionouseTracking: false,
      },
      column: {
        crisp: false,
      },
    },
  }}
/>

export default function Countries() {

  const [series, setSeries] = React.useState<string>("reserves")
  const [group, setGroup] = React.useState<string>("World")
  const [worldData, setWorldData] = React.useState<CountryData[]>([])
  const [data, setData] = React.useState<CountryData[]>([])
  const [useLogScale, setUseLogScale] = React.useState<boolean>(true)
  const [chartType, setChartType] = React.useState<string>("bar")

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
        const tmp: CountryData[] = Object.entries(res)
          .sort((a: unknown, b: unknown) => {
            return (b as CountryData).y - (a as CountryData).y
          })
          .map(([name, y], i) => ({
            name,
            y: (y as number) * availableSeries[series].multiplier,
            color: name === "TH" ? "#ff0000" : undefined,
            rank: i + 1,
          }))
        setWorldData(tmp)
      })
  }, [series])

  React.useEffect(() => {
    if (group === "Top 20") {
      const tmp = worldData.slice(0, 20)
      if (tmp.findIndex(d => d.name === "TH") === -1) {
        // TH is not in top 20
        const thRank = worldData.findIndex(d => d.name === "TH")
        if (thRank > 0) tmp.push({ ...worldData[thRank], name: `TH` })
      }
      setData(tmp)
      return
    }
    setData(worldData.filter(d => {
      if (group === "World") return true
      return d.name === "TH" || groups[group].includes(d.name)
    }))
  }, [group, worldData])

  return(
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,
      height: '100%',
    }}>
      <Box sx={{
        display: "flex",
        gap: 2,
        marginTop: 1,
      }}>

        <FormControl size="small" sx={{minWidth: 280}}>
          <InputLabel>Series</InputLabel>
          <Select
            value={series}
            label="Series"
            onChange={e => setSeries(e.target.value as string)}
          >
            {Object.entries(availableSeries).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={group}
          size="small"
          exclusive
          onChange={(_e, newGroup) => {
            if (newGroup === null) return
            setGroup(newGroup)
          }}
          aria-label="group"
        >
          {Object.keys(groups).map(group => <ToggleButton value={group} key={group}>{group}</ToggleButton>)}
        </ToggleButtonGroup>

        <FormControlLabel control={<Switch checked={useLogScale} onChange={() => setUseLogScale(!useLogScale)}/>} label="Log scale" />

        <ToggleButtonGroup
          value={chartType}
          size="small"
          exclusive
          onChange={(_e, newChartType) => {
            if (newChartType === null) return
            setChartType(newChartType)
          }}
          aria-label="chart type"
        >
          <ToggleButton value={"bar"}><BarChartIcon /></ToggleButton>
          <ToggleButton value={"map"}><MapIcon /></ToggleButton>
        </ToggleButtonGroup>

      </Box>
      {chartType === "map"
        ? <Map data={data} series={series} useLogScale={useLogScale} />
        : <Bar data={data} series={series} useLogScale={useLogScale} />
      }
    </Box>
  )

}