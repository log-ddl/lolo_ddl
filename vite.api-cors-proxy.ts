import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type DevRequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => boolean | Promise<boolean>

interface ApiCorsProxyPluginOptions {
  handleRequest?: DevRequestHandler
}

/**
 * Registers the development-only API proxy and, optionally, another request
 * handler that must run before it (for example the local CLI transport).
 */
export function apiCorsProxyPlugin(
  options: ApiCorsProxyPluginOptions = {},
): Plugin {
  return {
    name: 'api-cors-proxy',
    configureServer(server) {
      if (options.handleRequest) {
        server.middlewares.use(async (req, res, next) => {
          if (await options.handleRequest?.(req, res)) {
            return
          }
          next()
        })
      }

      server.middlewares.use('/__api_proxy', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          })
          res.end()
          return
        }

        const urlParam = new URL(req.url || '', 'http://localhost').searchParams.get('url')
        if (!urlParam) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing ?url= parameter' }))
          return
        }

        try {
          const bodyChunks: Buffer[] = []
          for await (const chunk of req) {
            bodyChunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
          }
          const body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined

          const proxyHeadersRaw = req.headers['x-proxy-headers']
          let forwardHeaders: Record<string, string> = {}
          if (typeof proxyHeadersRaw === 'string') {
            try {
              forwardHeaders = JSON.parse(proxyHeadersRaw)
            } catch {
              // Ignore malformed optional proxy headers.
            }
          }

          const response = await fetch(urlParam, {
            method: req.method || 'GET',
            headers: forwardHeaders,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
          })

          const responseBody = await response.arrayBuffer()
          const headers: Record<string, string> = {
            'Access-Control-Allow-Origin': '*',
          }
          const contentType = response.headers.get('content-type')
          if (contentType) headers['Content-Type'] = contentType

          res.writeHead(response.status, headers)
          res.end(Buffer.from(responseBody))
        } catch (error: any) {
          const cause = error?.cause?.message || error?.cause?.code || ''
          console.error(
            `[api-cors-proxy] Unexpected error: ${error?.message}${cause ? ` | cause: ${cause}` : ''}`,
          )
          res.writeHead(502, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(JSON.stringify({
            error: 'Proxy request failed',
            detail: error?.message,
            cause,
          }))
        }
      })
    },
  }
}
