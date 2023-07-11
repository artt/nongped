// wrapper for react-router-dom Link that prepends the base path

// import MuiLink from "@mui/material/Link"
import { Link as RouterLink } from "react-router-dom"

export default function Link({ to, ...props }: { to: string, [key: string]: unknown }) {
  const base = import.meta.env.BASE_URL
  return <RouterLink to={`${base}${to}`} {...props} />
}