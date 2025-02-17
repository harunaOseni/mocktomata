import type { Log } from '@mocktomata/framework'

export type ServiceOptions = {
	/**
	 * URL to the mocktomata service.
	 */
	url: string
}

export type CreateIOOptions = ServiceOptions & Log.Context
