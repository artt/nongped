import type { SeriesDefinition, ComponentChartData, Frequency } from "types"
import { quarterToMonth, getMonthName, getSeries } from "utils";
import { HorizontalChevronCell, HorizontalChevronCellTemplate } from "./HorizontalChevronCellTemplate";
import Box from "@mui/material/Box";
import clsx from "clsx";

import { ReactGrid, Column, Row, NumberCell, HeaderCell, DefaultCellTypes, CellChange } from "@silevis/reactgrid";

import "./styles.scss"

type RowCells = DefaultCellTypes | HorizontalChevronCell
type SummaryRow = Row<RowCells>

interface Props {
  freqList: string[]
  labelDefs: SeriesDefinition[]
  headerWidth?: number
  cellWidth?: number
  data?: ComponentChartData
  minDate?: string
  maxDate?: string
  setData: (data: ComponentChartData) => void
}

/**
 * Check if the period is the last period of the block
 */
function isLastPeriodOfBlock(period: string, freq: Frequency) {
  switch(freq) {
    case "M": return period.slice(-2) === "12"
    case "Q": return period.slice(-2) === "Q4"
    case "Y": return parseInt(period) % 10 === 9
  }
}
// heiararchy
export default function SummaryTable({ labelDefs, headerWidth=100, cellWidth=50, data, minDate, maxDate, setData }: Props) {

  if (!data) return null

  // TODO: can refactor these "cases" out to a function foo(p.t, date, freq, side)
  // const tableData = deepmerge([], data.series)
  // find index of min and max in range
  let minIndex = 0
  let maxIndex = data.series[0].data.length - 1
  if (minDate !== undefined) {
    minIndex = data.series[0].data.findLastIndex((p: {t: string}) => {
      switch(data.freq) {
        case 'M': return new Date(p.t) <= new Date(minDate)
        case 'Q': return new Date(quarterToMonth(p.t)) <= new Date(minDate)
        case 'Y': return new Date(p.t.slice(0, 4)) <= new Date(minDate)
      }
    })
    if (minIndex === -1) minIndex = 0
  }
  if (maxDate !== undefined) {
    maxIndex = data.series[0].data.findIndex(p => {
      switch(data.freq) {
        case 'M': return new Date(p.t) >= new Date(maxDate)
        case 'Q': return new Date(quarterToMonth(p.t)) >= new Date(maxDate)
        case 'Y': return new Date(p.t.slice(0, 4)) >= new Date(maxDate)
      }
    })
    if (maxIndex === -1) maxIndex = data.series[0].data.length - 1
  }
  // data.series?.forEach((series, i) => {
  //   data.series[i].data = series.data.slice(minIndex, maxIndex + 1)
  // })
  
  const numPeriods = maxIndex -  minIndex + 1

  // yearSpans is an array of object indicating year and its column spans
  const yearSpans = data.series[0].data.slice(minIndex, maxIndex + 1).reduce((acc, p, i, a) => {
    if (i === 0) return acc
    if (p.t.slice(0, 4) === a[i - 1].t.slice(0, 4)) {
      acc[acc.length - 1].span ++
    } else {
      acc.push({ year: p.t.slice(0, 4), span: 1 })
    }
    return acc
  }, [{ year: data.series[0].data[minIndex].t.slice(0, 4), span: 1 }])

  const columns: Column[] = [
    { columnId: "series", width: headerWidth },
    ...Array.from({length: numPeriods}, (_, i) => ({ columnId: `data-${i}`, width: cellWidth }))
  ]

  const periodRow: SummaryRow = {
    rowId: "period",
    cells: [
      { type: "header", text: "Period" },
      ...data.series[0].data.slice(minIndex, maxIndex + 1).map<HeaderCell>((p, i) => ({
        type: "header",
        text: data.freq === "M"
          ? getMonthName(parseInt(p.t.slice(-2)))
          : data.freq === "Q"
            ? p.t.slice(-2)
            : p.t,
        className: clsx(
          isLastPeriodOfBlock(p.t, data.freq) && i < numPeriods - 1 && "last-period",
        ),
        rowspan: data.freq === "Y" ? 2 : 1,
      }))
    ],
  }

  const yearRow: SummaryRow = {
    rowId: "year",
    cells: [
      {
        type: "header",
        text: "Year",
        className: "last-header",
      },
      ...yearSpans.reduce<HeaderCell[]>((acc, cur, i) => acc.concat([
        data.freq !== "Y"
        ? {
            type: "header",
            text: cur.year,
            colspan: cur.span,
            className: clsx(
              i < yearSpans.length - 1 && "last-period",
              "last-header",
            ),
          }
        : {
            type: "header",
            text: "",
          },
        ...Array(cur.span - 1).fill({ type: "header", text: "" })
      ]), [])
    ],
  }

  const formatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const dataRows: SummaryRow[] = data.series.map(series => {
    const curSeries = getSeries(series.name, labelDefs)
    return {
      rowId: series.name,
      cells: [
        {
          // type: "header",
          // type: "chevron",
          type: "horizontalChevron",
          text: curSeries.label,
          className: 'series-name',
          hasChildren: curSeries.children !== undefined,
          // parentId: series.name === data.series[0].name ? undefined : data.series[0].name,
          indent: curSeries.depth, //series.name === data.series[0].name ? 0 : 1,
          isExpanded: series.isExpanded,
        },
        ...series.data.slice(minIndex, maxIndex + 1).map<NumberCell>((p, i) => ({
          type: "number",
          nonEditable: true,
          value: (p.v * (data.mode === "level" ? 1 : 100)),
          format: formatter,
          className: clsx(
            isLastPeriodOfBlock(p.t, data.freq) && i < series.data.length - 1 && "last-period",
          ),
        }))
      ],
    }
  })

  const handleChanges = (changes: CellChange<RowCells>[]) => {
    const newData = {...data}
    console.log(data)
    changes.forEach(change => {
      // console.log(change)
      const seriesIndex = data.series.findIndex(el => el.name === change.rowId);
      newData.series[seriesIndex].isExpanded = (change.newCell as HorizontalChevronCell).isExpanded
      // const changeColumnIdx = columns.findIndex(el => el.columnId === change.columnId);

    })
    // console.log(newData)
    setData(newData)
  }

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
        // enableRowSelection
        // enableColumnSelection
        stickyLeftColumns={1}
        customCellTemplates={{
          horizontalChevron: new HorizontalChevronCellTemplate(),
        }}
        onCellsChanged={handleChanges}
      />
    </Box>
  )

}