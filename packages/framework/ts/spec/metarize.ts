import { json } from '../json.js'
import { fromMetaObj, toMetaObj } from './metarize.ctx.js'

/**
 * Convert a value to a serialized metadata.
 *
 * This is a generic implementation.
 * Plugin can choose to use this implementation or create their own.
 */
export function metarize(value: unknown) {
	return json.stringify(toMetaObj(value))
}
/**
 * Convert a metadata back to a value.
 *
 * This is a generic implementation.
 * Plugin can choose to use this implementation or create their own.
 */
export function demetarize(meta: string) {
	return fromMetaObj(json.parse(meta))
}
