import { createStore } from 'global-store';
import { SpecPluginInstance } from './types-internal';

export type SpecStore = {
  // What is this?
  specTypeIds: Record<string, number>,
  plugins: SpecPluginInstance[]
}

export const store = createStore<SpecStore>({
  moduleName: '@mocktomata/framework',
  key: 'spec:578b2645-0a5b-4364-89a7-0906d214d769',
  version: '7.0.0',
  initializer: (current) => {
    return {
      specTypeIds: {},
      plugins: [],
      ...current
    } as SpecStore
  }
})
