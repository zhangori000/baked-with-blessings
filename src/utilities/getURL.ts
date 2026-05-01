import { canUseDOM } from './canUseDOM'

export const getServerSideURL = () => {
  const url = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  const vercelURL = process.env.VERCEL_URL?.trim()
  const productionURL = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const isLocalURL = url?.includes('localhost') || url?.includes('127.0.0.1')

  if (url && !(process.env.VERCEL && isLocalURL)) {
    return url
  }

  if (process.env.VERCEL_ENV === 'preview' && vercelURL) {
    return `https://${vercelURL}`
  }

  if (productionURL) {
    return `https://${productionURL}`
  }

  if (vercelURL) {
    return `https://${vercelURL}`
  }

  return 'http://localhost:3000'
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  return getServerSideURL()
}
