import type { ComponentChartData, ContributionMode, Frequency, ProcessedSeriesDefinition, SeriesState } from "types"
import { quarterToMonth, getMonthName, isAnyParentCollapsed, getSeries } from "utils";
import { HorizontalChevronCell, HorizontalChevronCellTemplate } from "./HorizontalChevronCellTemplate";
import Box from "@mui/material/Box";
import clsx from "clsx";

import { ReactGrid, Column, Row, NumberCell, HeaderCell, DefaultCellTypes, CellChange } from "@silevis/reactgrid";

import "./styles.scss"

type RowCells = DefaultCellTypes | HorizontalChevronCell
type SummaryRow = Row<RowCells>

interface Props {
  freqList: string[]
  seriesDefs: ProcessedSeriesDefinition[]
  headerWidth?: number
  cellWidths?: Record<ContributionMode, number>
  data?: ComponentChartData
  seriesState: SeriesState
  minDate?: string
  maxDate?: string
  setSeriesState: (state: SeriesState) => void
  setCurrentHoveredSeries: (series: string) => void
  digits?: {[x: string]: number}
}

/**
 * Check if the period is the last period of the block
 */
function isLastPeriodOfBlock(period: string, freq: Frequency) {
  switch(freq) {
    case "M": return period.slice(-2) === "12"
    case "Q": return period.slice(-2) === "Q4"
    case "Y": return parseInt(period) % 10 === 0
  }
}
// heiararchy
export default function SummaryTable({ seriesDefs, headerWidth=100, cellWidths={levelReal: 50, growth: 50, contribution: 50}, data, seriesState, minDate, maxDate, setSeriesState, setCurrentHoveredSeries, digits={} }: Props) {

  if (!data) return null

  // TODO: can refactor these "cases" out to a function foo(p.t, date, freq, side)
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
    ...Array.from({length: numPeriods}, (_, i) => ({ columnId: `data-${i}`, width: cellWidths[data.mode] }))
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

  const d = digits[data.mode] === undefined ? 2 : digits[data.mode]
  const formatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })

  const dataRows: SummaryRow[] = []
  data.series.forEach(series => {
    const curSeries = getSeries(series.name, seriesDefs)
    // filter only rows that need to be shown
    if (isAnyParentCollapsed(series.name, seriesState, seriesDefs)) return
    dataRows.push({
      rowId: series.name,
      cells: [
        {
          // type: "header",
          // type: "chevron",
          type: "horizontalChevron",
          text: curSeries.label,
          setCurrentHoveredSeries: setCurrentHoveredSeries,
          hasChildren: curSeries.children.length > 0,
          parentId: curSeries.parent,
          indent: curSeries.depth,
          isExpanded: seriesState[series.name].isExpanded,
          className: clsx(
            'series-name',
          ),
        },
        ...series.data.slice(minIndex, maxIndex + 1).map<NumberCell>((p, i) => ({
          type: "number",
          nonEditable: true,
          value: (p.v * (data.mode === "levelReal" ? 1 : 100)),
          format: formatter,
          className: clsx(
            isLastPeriodOfBlock(p.t, data.freq) && i < series.data.length - 1 && "last-period",
          ),
        }))
      ],
    })
  })

  const handleChanges = (changes: CellChange<RowCells>[]) => {
    const newState = {...seriesState}
    changes.forEach(change => {
      const newCell = change.newCell as HorizontalChevronCell
      const oldCell = change.previousCell as HorizontalChevronCell
      // check if the change is expanding/collapsing
      if (newCell.isExpanded !== oldCell.isExpanded) {
        newState[change.rowId].isExpanded = newCell.isExpanded
        getSeries(change.rowId, seriesDefs).children.forEach(child => {
          newState[getSeries(child, data.series).name].isParentCollapsed = !newCell.isExpanded
        })
      }
    })
    setSeriesState(newState)
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