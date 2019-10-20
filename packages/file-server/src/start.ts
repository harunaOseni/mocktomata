import boom from 'boom';
import { RequestInfo, Server, ServerInfo } from 'hapi';
import path from 'path';
import { required } from 'unpartial';
import { context } from './context';
import { Options } from './types';
import { atob } from './base64';

export async function start(options?: Partial<Options>) {
  const o = required<Options>({}, options)

  const server = o.port ? new Server({ port: o.port, routes: { 'cors': true } }) : await tryCreateHapi(3698, 3708)
  defineRoutes(server)

  await server.start()
  return {
    info: server.info,
    stop(options?: { timeout: number }) {
      return server.stop(options)
    }
  }
}

async function tryCreateHapi(start: number, end: number, port = start): Promise<Server> {
  // istanbul ignore next
  if (port > end) {
    throw new Error(`Unable to start mocktomata server using port from ${start} to ${end}`)
  }

  try {
    const server = new Server({ port, routes: { 'cors': true } })
    await server.start()
    await server.stop()
    return server
  }
  catch (e) {
    return await tryCreateHapi(start, end, port + 1)
  }
}

function defineRoutes(server: Server) {
  server.route([
    {
      method: 'GET',
      path: '/mocktomata/info',
      handler: async (request) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pjson = require(path.resolve(__dirname, '../package.json'))
        return JSON.stringify({
          name: 'mocktomata',
          version: pjson.version,
          url: getReflectiveUrl(request.info, server.info),
          plugins: await context.value.repository.getPluginList()
        })
      }
    },
    // {
    //   method: 'GET',
    //   path: '/mocktomata/config',
    //   options: { cors: true },
    //   handler: async (request, h) => {
    //     return JSON.stringify(loadConfig(cwd))
    //   }
    // },
    {
      method: 'GET',
      path: '/mocktomata/specs/{id}',
      handler: async (request) => {
        try {
          const { title, invokePath } = JSON.parse(atob(request.params.id))
          return await context.value.repository.readSpec(title, invokePath)
        }
        catch (e) {
          throw boom.notFound(e.message)
        }
      }
    },
    {
      method: 'POST',
      path: '/mocktomata/specs/{id}',
      handler: async (request, h) => {
        const { title, invokePath } = JSON.parse(atob(request.params.id))
        await context.value.repository.writeSpec(title, invokePath, request.payload as string)
        return h.response()
      }
    },
  ])
}

/**
 * If request is calling from local, return as localhost.
 */
function getReflectiveUrl(requestInfo: RequestInfo, serverInfo: ServerInfo) {
  if (requestInfo.remoteAddress === '127.0.0.1') {
    return `${serverInfo.protocol}://localhost:${serverInfo.port}`
  }
  // istanbul ignore next
  return serverInfo.uri
}
