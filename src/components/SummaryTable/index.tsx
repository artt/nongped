import type { LabelDefType, ComponentChartDataType } from "types"
import { quarterToMonth, getMonthName } from "utils";
import deepmerge from "deepmerge"
import clsx from "clsx"
import Box from "@mui/material/Box";

import "./styles.scss"

interface Props {
  freqList: string[]
  labelDefs: LabelDefType
  headerWidth?: number
  cellWidth?: number
  data?: ComponentChartDataType
  minDate?: string
  maxDate?: string
}

export default function SummaryTable({ labelDefs, headerWidth=100, cellWidth=50, data, minDate, maxDate }: Props) {
  
  if (!data) return null

  // TODO: can refactor these "cases" out to a function foo(p.t, date, freq, side)
  const tableData = deepmerge([], data.tableSeries)
  // find index of min and max in range
  let minIndex = 0
  let maxIndex = tableData[0].data.length - 1
  if (minDate !== undefined) {
    minIndex = tableData[0].data.findLastIndex((p: {t: string}) => {
      switch(data.freq) {
        case 'M': return new Date(p.t) <= new Date(minDate)
        case 'Q': return new Date(quarterToMonth(p.t)) <= new Date(minDate)
        case 'Y': return new Date(p.t.slice(0, 4)) <= new Date(minDate)
      }
    })
    if (minIndex === -1) minIndex = 0
  }
  if (maxDate !== undefined) {
    maxIndex = tableData[0].data.findIndex(p => {
      switch(data.freq) {
        case 'M': return new Date(p.t) >= new Date(maxDate)
        case 'Q': return new Date(quarterToMonth(p.t)) >= new Date(maxDate)
        case 'Y': return new Date(p.t.slice(0, 4)) >= new Date(maxDate)
      }
    })
    if (maxIndex === -1) maxIndex = tableData[0].data.length - 1
  }
  tableData?.forEach((series, i) => {
    tableData[i].data = series.data.slice(minIndex, maxIndex + 1)
  })

  const tmp = tableData[0].data.reduce((acc, p, i, a) => {
    if (i === 0) return acc
    if (p.t.slice(0, 4) === a[i - 1].t.slice(0, 4)) {
      acc[acc.length - 1].span ++
    } else {
      acc.push({ year: p.t.slice(0, 4), span: 1 })
    }
    return acc
  }, [{ year: tableData[0].data[0].t.slice(0, 4), span: 1 }])

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
            <th className="sticky-column-header" style={{minWidth: `${headerWidth}px`}}>Year</th>
            {/* merge all the years that are the same together and make them span all the cells with the same year */}
            {/* note that there might not be 12 periods in a year */}
            {tmp.map((p, i) => <th className="right-border" key={i} colSpan={p.span} rowSpan={data.freq === "Y" ? 2 : 1}>{p.year}</th>)}
          </tr>
          <tr>
            <th className="sticky-column-header">Period</th>
            {data.freq !== "Y" && tableData[0].data.map((p, i) => (
              <th
                key={i}
                className={clsx(yearCutoffs.includes(i + 1) && "right-border")}
              >
                {data.freq === "M"
                  ? getMonthName(parseInt(p.t.slice(-2)))
                  : data.freq === "Q" ? p.t.slice(-2) : ""
                }
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((series, i) => (
            <tr key={i}>
              <td className="sticky-column-header">{labelDefs[series.name].label}</td>
              {series.data.map((p, i) => (
                <td
                  key={i}
                  className={clsx(yearCutoffs.includes(i + 1) && "right-border")}
                  style={{minWidth: `${cellWidth}px`, maxWidth: `${cellWidth}px`}}
                >
                  {(p.v * (data.showGrowth ? 100 : 1)).toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}