import { SpecMode } from './types';

/**
 * Get the effective SpecMode for the specified id.
 * @param _specId spec id.
 * @param defaultMode The default SpecMode to return if SpecMode is not changed by config for the specified id.
 */
export function getEffectiveSpecMode(_specId: string, defaultMode: SpecMode): SpecMode {
  // TODO: get mode based on config
  return defaultMode
}
