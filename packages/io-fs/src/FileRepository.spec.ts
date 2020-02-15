import { FileRepository } from './FileRepository'
import { fixturePath } from './util'

test('load config', () => {
  const repo = getTestRepo()
  const config = repo.loadConfig()
  expect(config.plugins).toEqual(['plugin-a'])
})

test('load plugin', () => {
  const repo = getTestRepo()
  const plugin = repo.loadPlugin('plugin-a')
  expect(typeof plugin.activate).toBe('function')
})

test('find installed plugins', async () => {
  const repo = getTestRepo()
  const plugins = await repo.findInstalledPlugins()
  expect(plugins).toEqual(['plugin-a', 'plugin-b'])
})

test('read/write spec', () => {
  const repo = getTestRepo()
  repo.writeSpec('some spec', __filename, 'abc')
  const spec = repo.readSpec('some spec', __filename)
  expect(spec).toBe('abc')
})

function getTestRepo() {
  const cwd = fixturePath('file-repository')
  return new FileRepository({ cwd })
}