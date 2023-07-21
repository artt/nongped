import React from "react"
// wrapper for react-router-dom Link that prepends the base path

// import MuiLink from "@mui/material/Link"
import { Link as RouterLink } from "react-router-dom"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Link = React.forwardRef(({ to, ...props }: { to: string, [key: string]: unknown }, _ref: unknown) => {
  const base = import.meta.env.BASE_URL
  return <RouterLink to={`${base}${to}`.replace("//", "/")} {...props} />
})

export default Link