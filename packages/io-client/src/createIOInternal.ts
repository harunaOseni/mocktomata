import { Mocktomata, SpecNotFound, SpecPlugin, SpecRecord } from '@mocktomata/framework'
import { pick } from 'type-plus'
import { buildUrl } from './buildUrl'
import { getServerInfo, ServerInfo } from './getServerInfo'
import { CreateIOOptions } from './types'
import { Context } from './typesInternal'

export async function createIOInternal({ fetch, location }: Context, options?: CreateIOOptions): Promise<Mocktomata.IO> {
  const info = await getServerInfo({ fetch, location }, options)
  return {
    async getSpecConfig() {
      const response = await fetch(buildUrl(info.url, `config`))
      const config = await response.json() as Mocktomata.Config
      return pick(config, 'overrideMode', 'filePathFilter', 'specNameFilter')
    },
    async getPluginList() {
      const response = await fetch(buildUrl(info.url, `info`))
      const si = await response.json() as ServerInfo
      return si.plugins
    },
    async loadPlugin(name: string): Promise<SpecPlugin.Module> {
      return import(name)
    },
    async readSpec(specName: string, specRelativePath: string): Promise<SpecRecord> {
      const id = btoa(JSON.stringify({ specName, specRelativePath }))
      const response = await fetch(buildUrl(info.url, `specs/${id}`))
      if (response.status === 404) {
        throw new SpecNotFound(id)
      }
      return response.json()
    },
    async writeSpec(specName: string, specRelativePath: string, record: SpecRecord) {
      const id = btoa(JSON.stringify({ specName, specRelativePath }))
      const response = await fetch(buildUrl(info.url, `specs/${id}`), { method: 'POST', body: JSON.stringify(record) })
      // istanbul ignore next
      if (!response.ok) {
        throw new Error(`failed to write spec: ${response.statusText}`)
      }
    },
  }
}
