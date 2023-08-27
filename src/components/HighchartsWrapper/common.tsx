export type Point = {
  series: {name: string},
  y: number,
}
export type TooltipPoint = {
  x: number,
  y: number,
  point?: Point,
  points?: Point[],
}

export const defaultOptions = {
  colors: [
    '#3f708c',
    '#f7af1c',
    '#2ca02c',  // cooked asparagus green
    '#d62728',  // brick red
    '#9467bd',  // muted purple
    '#8c564b',  // chestnut brown
    '#e377c2',  // raspberry yogurt pink
    '#7f7f7f',  // middle gray
    '#bcbd22',  // curry yellow-green
    '#17becf',  // blue-teal
  ],
  title: {
    text: "",
  },
  credits: {
    enabled: false,
  },
  plotOptions: {
    series: {
      lineWidth: 2,
    },
  },
  chart: {
    backgroundColor: 'transparent',
  },
}

export function ticksPercentFormatter(this: {value:number}, _o: object, dontMultiply = false): string {
  return `${(this.value * (dontMultiply ? 1 : 100)).toFixed(0)}%`
}
export function percentFormatterNumber(y: number, dontMultiply = false): string {
  return `${(y * (dontMultiply ? 1 : 100)).toFixed(2)}%`
}
export function percentFormatter(this: TooltipPoint, _o: object, dontMultiply = false): string {
  if (this.points !== undefined) {
    return this.points.map(point => `${point.series.name}: <b>${(point.y * (dontMultiply ? 1 : 100)).toFixed(2)}%</b>`).join('<br/>')
  }
  return percentFormatterNumber(this.y, dontMultiply)
}