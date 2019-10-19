import { SpecPluginModule } from '@mocktomata/framework';
import path from 'path';
import { getConfig } from './config';
import { createPluginRepository } from './plugin';
import { createScenarioRepository } from './scenario';
import { createSpecRepository } from './spec';

export type Repository = {
  readSpec(title: string, invokePath: string): Promise<string>,
  writeSpec(title: string, invokePath: string, data: string): Promise<void>,
  readScenario(id: string): Promise<string>,
  writeScenario(id: string, data: string): Promise<void>,
  getPluginList(): Promise<string[]>,
  loadPlugin(name: string): Promise<SpecPluginModule>
}

export function createFileRepository(cwd: string): Repository {
  const config = getConfig(cwd)
  const mocktomataFolder = path.resolve(cwd, config.mocktomataFolder)
  const spec = createSpecRepository(mocktomataFolder)
  const scenario = createScenarioRepository(mocktomataFolder)
  const plugin = createPluginRepository({ cwd, config })
  return {
    ...spec,
    ...scenario,
    ...plugin
  }
}
