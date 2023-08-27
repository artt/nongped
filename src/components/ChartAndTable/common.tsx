import { defaultOptions } from "components/HighchartsWrapper/common"

export const labelDefs: {[x: string]: {label: string, color: string}} = {
  cpi: {
    label: 'CPI',
    color: defaultOptions.colors[0],
  },
  cpi_core: {
    label: 'Core',
    color: defaultOptions.colors[1],
  },
  cpi_rawfood: {
    label: 'Raw Food',
    color: defaultOptions.colors[2],
  },
  cpi_energy: {
    label: 'Energy',
    color: defaultOptions.colors[3],
  },
}