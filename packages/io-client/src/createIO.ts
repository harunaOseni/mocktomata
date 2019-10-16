import { KomondorIO } from '@mocktomata/framework';
import fetch from 'cross-fetch';
import { createIOInternal } from './createIOInternal';
import { CreateIOOptions } from './types';

export async function createIO(options?: CreateIOOptions): Promise<KomondorIO> {
  return createIOInternal({ fetch, location }, options)
}
