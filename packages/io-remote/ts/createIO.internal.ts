import { Mocktomata, SpecNotFound, SpecPlugin, SpecRecord } from '@mocktomata/framework'
import { buildUrl } from './buildUrl.js'
import { getServerInfo } from './getServerInfo.js'
import type { Context } from './types.internal.js'
import type { CreateIOOptions } from './types.js'

export async function createIOInternal(ctx: Context, options?: CreateIOOptions): Promise<Mocktomata.IO> {
  const info = await getServerInfo(ctx, options)
  return {
    async loadConfig() {
      // @TODO add browser config?
      const url = buildUrl(info.url, `config`)
      const response = await ctx.fetch(url)
      return response.json()
    },
    async loadPlugin(name: string): Promise<SpecPlugin.Module> {
      return ctx.importModule(name)
    },
    async readSpec(specName: string, specRelativePath: string): Promise<SpecRecord> {
      const id = btoa(JSON.stringify({ specName, specRelativePath }))
      const response = await ctx.fetch(buildUrl(info.url, `specs/${id}`))
      if (response.status === 404) {
        throw new SpecNotFound(id, specRelativePath)
      }
      return response.json()
    },
    async writeSpec(specName, specRelativePath, record) {
      const id = btoa(JSON.stringify({ specName, specRelativePath }))
      const response = await ctx.fetch(buildUrl(info.url, `specs/${id}`), { method: 'POST', body: JSON.stringify(record) })
      // istanbul ignore next
      if (!response.ok) {
        throw new Error(`failed to write spec: ${response.statusText}`)
      }
    },
  }
}
