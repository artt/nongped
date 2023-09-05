import type { SeriesDefType, ComponentChartDataType, freqType } from "types"
import { quarterToMonth, getMonthName, getSeries } from "utils";
import deepmerge from "deepmerge"
import Box from "@mui/material/Box";
import clsx from "clsx";

import { ReactGrid, Column, Row, NumberCell, HeaderCell } from "@silevis/reactgrid";

import "./styles.scss"

interface Props {
  freqList: string[]
  labelDefs: SeriesDefType[]
  headerWidth?: number
  cellWidth?: number
  data?: ComponentChartDataType
  minDate?: string
  maxDate?: string
}

/**
 * Check if the period is the last period of the block
 */
function isLastPeriodOfBlock(period: string, freq: freqType) {
  switch(freq) {
    case "M": return period.slice(-2) === "12"
    case "Q": return period.slice(-2) === "Q4"
    case "Y": return parseInt(period) % 10 === 9
  }
}
// heiararchy
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

  const columns: Column[] = [
    { columnId: "series", width: headerWidth },
    ...Array.from({length: tableData[0].data.length}, (_, i) => ({ columnId: `data-${i}`, width: cellWidth }))
  ]

  const yearRow: Row = {
    rowId: "year",
    cells: [
      {
        type: "header",
        text: "Year",
        className: "last-header",
      },
      ...tmp.reduce<HeaderCell[]>((acc, cur, i) => acc.concat([
        {
          type: "header",
          text: cur.year, colspan: cur.span,
          className: clsx(
            i < tmp.length - 1 && "last-period",
            "last-header",
          ),
        },
        ...Array(cur.span - 1).fill({ type: "header", text: "" })
      ]), [])
    ],
  }

  const periodRow: Row = {
    rowId: "period",
    cells: [
      { type: "header", text: "Period" },
      ...tableData[0].data.map<HeaderCell>((p, i) => ({
        type: "header",
        text: data.freq === "M"
          ? getMonthName(parseInt(p.t.slice(-2)))
          : data.freq === "Q"
            ? p.t.slice(-2)
            : "",
        className: clsx(
          isLastPeriodOfBlock(p.t, data.freq) && i < tableData[0].data.length - 1 && "last-period",
        )
      }))
    ],
  }

  const formatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const dataRows: Row[] = tableData.map(series => ({
    rowId: series.name,
    cells: [
      {
        type: "header",
        text: getSeries(series.name, labelDefs).label,
        className: 'series-name',
      },
      ...series.data.map<NumberCell>((p, i) => ({
        type: "number",
        value: (p.v * (data.mode === "level" ? 1 : 100)),
        format: formatter,
        className: clsx(
          isLastPeriodOfBlock(p.t, data.freq) && i < series.data.length - 1 && "last-period",
        ),
      }))
    ],
  }))

  return(
    <Box className="summary-table-container" sx={{ paddingBottom: '10px' }}>
      <ReactGrid
        columns={columns}
        rows={[
          periodRow,
          yearRow,
          ...dataRows,
        ]}
        enableRangeSelection
        enableRowSelection
        enableColumnSelection
        stickyLeftColumns={1}
      />
    </Box>
  )

}