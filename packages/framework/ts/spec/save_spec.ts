import type { AsyncContext } from 'async-fp'
import { prettyPrintSpecRecord } from '../spec_record/index.js'
import { assertMockable } from './asserts.js'
import { assertSpecName } from './asserts.js'
import { createRecorder } from './recorder.js'
import type { createSpec } from './types.internal.js'
import type { Spec } from './types.js'

export async function createSaveSpec(
	context: AsyncContext<createSpec.Context>,
	specName: string,
	invokePath: string,
	options: Spec.Options
): Promise<Spec> {
	assertSpecName(specName)

	const recorder = createRecorder(context, specName, options)

	return Object.assign(
		async <S>(subject: S) => {
			assertMockable(subject)
			return recorder.createSpy<S>(subject)
		},
		{
			get mode() {
				return 'save' as const
			},
			async done() {
				recorder.end()
				const { io, maskCriteria, log } = await context.get()
				const record = recorder.getSpecRecord(maskCriteria)
				io.writeSpec(specName, invokePath, record)
				log.debug(`Spec Record "${specName}":`, prettyPrintSpecRecord(record))
				log.trace(`Spec Record "${specName}" written to: ${invokePath}`)
				return record
			},
			ignoreMismatch(value: any) {
				const valueType = typeof value
				if (valueType !== 'bigint' && valueType !== 'boolean' && valueType !== 'number') return
				recorder.addInertValue(value)
			},
			maskValue(value: string, replaceWith?: string) {
				recorder.addMaskValue(value, replaceWith)
			}
		}
	)
}
