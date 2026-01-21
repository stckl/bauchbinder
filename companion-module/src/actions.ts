import { CompanionActionDefinition, CompanionActionEvent } from '@companion-module/base'
import { ModuleInstance } from './main'

export enum ActionId {
	Show = 'show',
	Hide = 'hide',
}

export function GetActions(instance: ModuleInstance): { [id: string]: CompanionActionDefinition } {
	const sendRequest = async (path: string) => {
		const url = `http://${instance.config.host}:${instance.config.port}${path}`
		try {
			const response = await fetch(url, { method: 'POST' })
			if (!response.ok) {
				instance.log('error', `HTTP Error: ${response.status} ${response.statusText}`)
			}
		} catch (e: any) {
			instance.log('error', `Connection Error: ${e.toString()}`)
		}
	}

	return {
		[ActionId.Show]: {
			name: 'Show Lower Third',
			options: [
				{
					type: 'number',
					label: 'ID (1-9)',
					id: 'id',
					default: 1,
					min: 1,
					max: 99,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const id = event.options.id
				await sendRequest(`/v1/show/${id}`)
			},
		},
		[ActionId.Hide]: {
			name: 'Hide Lower Third',
			options: [],
			callback: async () => {
				await sendRequest(`/v1/hide`)
			},
		},
	}
}
