// export const serverAddress = process.env.NODE_ENV === "development"
//   ? `http://localhost:1443`
//   : `https://nongped.api.artt.dev`

export const serverAddress = "https://nongped.api.artt.dev"

export const curYear = new Date().getFullYear()

export function percentFormatter(this: {y: number}): string {
  return `${(this.y * 100).toFixed(2)}%`
}