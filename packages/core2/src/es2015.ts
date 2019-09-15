import { arrayPlugin } from './array';
import { errorPlugin } from './error';
import { functionPlugin } from './function';
import { objectPlugin } from './object';
import { SpecPluginActivationContext } from './spec';
import { promisePlugin } from './promise';
import { stringPlugin } from './string';
import { undefinedPlugin } from './undefined';

export function activate(context: SpecPluginActivationContext) {
  context.register(undefinedPlugin)
  context.register(stringPlugin)
  context.register(objectPlugin)
  context.register(arrayPlugin)
  context.register(functionPlugin)
  context.register(errorPlugin)
  context.register(promisePlugin)
}