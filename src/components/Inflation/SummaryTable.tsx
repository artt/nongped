import type { ProcessedData } from ".";
import { labelDefs } from "./index"
import deepmerge from "deepmerge"
import clsx from "clsx"
import Box from "@mui/material/Box";
import { quarterToMonth } from "utils";

// return month name, like 1 -> Jan, 2 -> Feb, etc.
function getMonthName(month: number) {
  return new Date(0, month - 1).toLocaleString('en-US', { month: 'short' })
}

interface Props {
  data?: ProcessedData
  minDate?: string
  maxDate?: string
}

export default function SummaryTable({ data, minDate, maxDate }: Props) {
  
  if (!data) return null

  const tableData = deepmerge([], data)
  // find index of min and max in range
  let minIndex = 0
  let maxIndex = tableData.series[0].data.length - 1
  if (minDate !== undefined) {
    minIndex = tableData.series[0].data.findLastIndex((p: {t: string}) => {
      switch(tableData.freq) {
        case 'M': return new Date(p.t) <= new Date(minDate)
        case 'Q': return new Date(quarterToMonth(p.t)) <= new Date(minDate)
        case 'Y': return new Date(p.t.slice(0, 4)) <= new Date(minDate)
      }
      return false
    })
    if (minIndex === -1) minIndex = 0
  }
  if (maxDate !== undefined) {
    maxIndex = tableData.series[0].data.findIndex(p => {
      switch(tableData.freq) {
        case 'M': return new Date(p.t) >= new Date(maxDate)
        case 'Q': return new Date(quarterToMonth(p.t)) >= new Date(maxDate)
        case 'Y': return new Date(p.t.slice(0, 4)) >= new Date(maxDate)
      }
      return false
    })
    if (maxIndex === -1) maxIndex = tableData.series[0].data.length - 1
  }
  tableData?.series.forEach((series, i) => {
    tableData.series[i].data = series.data.slice(minIndex, maxIndex + 1)
  })

  const tmp = tableData.series[0].data.reduce((acc, p, i, a) => {
    if (i === 0) return acc
    if (p.t.slice(0, 4) === a[i - 1].t.slice(0, 4)) {
      acc[acc.length - 1].span ++
    } else {
      acc.push({ year: p.t.slice(0, 4), span: 1 })
    }
    return acc
  }, [{ year: tableData.series[0].data[0].t.slice(0, 4), span: 1 }])

  const yearCutoffs = tmp.map(p => p.span).reduce((acc, _p, i, a) => {
    if (i === 0) return acc
    acc.push(acc[i - 1] + a[i - 1])
    return acc
  }, [0])

  return(
    <Box className="inflation-table-container" sx={{ paddingBottom: '10px' }}>
      <table>
        <thead>
          <tr>
            <th className="sticky-column-header">Year</th>
            {/* merge all the years that are the same together and make them span all the cells with the same year */}
            {/* note that there might not be 12 periods in a year */}
            {tmp.map((p, i) => <th className="right-border" key={i} colSpan={p.span} rowSpan={tableData.freq === "Y" ? 2 : 1}>{p.year}</th>)}
          </tr>
          <tr>
            <th className="sticky-column-header">Period</th>
            {tableData.freq !== "Y" && tableData.series[0].data.map((p, i) => (
              <th
                key={i}
                className={clsx(yearCutoffs.includes(i + 1) && "right-border")}
              >
                {tableData.freq === "M"
                  ? getMonthName(parseInt(p.t.slice(-2)))
                  : tableData.freq === "Q" ? p.t.slice(-2) : ""
                }
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.series.map((series, i) => (
            <tr key={i}>
              <td className="sticky-column-header">{labelDefs[series.name].label}</td>
              {series.data.map((p, i) => (
                <td
                  key={i}
                  className={clsx(yearCutoffs.includes(i + 1) && "right-border")}
                >
                  {(p.v * (tableData.showGrowth ? 100 : 1)).toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}