import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField, CompanionFeedbackDefinitions, CompanionFeedbackButtonStyleResult } from '@companion-module/base'
import { GetConfigFields, ModuleConfig } from './config'
import { GetActions } from './actions'
import { GetPresets } from './presets'

interface LowerThird {
	id: number
	name: string
	title: string
}

interface APIResponse {
	activeId: number | null
	list: LowerThird[]
}

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	public config: ModuleConfig = {
		host: '127.0.0.1',
		port: 5001,
	}

	private pollInterval: NodeJS.Timeout | undefined
	private activeId: number | null = null

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)

		this.setActionDefinitions(GetActions(this))
		this.initFeedbacks()
		this.setPresetDefinitions(GetPresets())
		this.initVariables()
		this.startPolling()
	}

	// Called when the configuration is updated
	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)
		this.stopPolling()
		this.startPolling()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	async destroy(): Promise<void> {
		this.stopPolling()
	}

	initVariables(): void {
		const variables = []
		variables.push({ variableId: 'active_id', name: 'Active Lower Third ID' })
		for (let i = 1; i <= 99; i++) {
			variables.push({ variableId: `name_${i}`, name: `Name ${i}` })
			variables.push({ variableId: `title_${i}`, name: `Title ${i}` })
		}
		this.setVariableDefinitions(variables)
	}

	initFeedbacks(): void {
		const feedbacks: CompanionFeedbackDefinitions = {
			active_lower_third: {
				type: 'boolean',
				name: 'Lower Third Active Status',
				description: 'Change style if lower third is active',
				defaultStyle: {
					bgcolor: 0x00aa00, // Green
					color: 0xffffff,
				},
				options: [
					{
						type: 'number',
						label: 'Lower Third ID',
						id: 'id',
						default: 1,
						min: 1,
						max: 99,
					},
				],
				callback: (feedback) => {
					return this.activeId === feedback.options.id
				},
			},
			hide_active: {
				type: 'boolean',
				name: 'Hide Button Active',
				description: 'Change style if NO lower third is active',
				defaultStyle: {
					bgcolor: 0xaa0000, // Red
					color: 0xffffff,
				},
				options: [],
				callback: () => {
					return this.activeId === null
				},
			}
		}
		this.setFeedbackDefinitions(feedbacks)
	}

	startPolling(): void {
		if (this.pollInterval) clearInterval(this.pollInterval)
		
		const poll = async () => {
			try {
				const url = `http://${this.config.host}:${this.config.port}/v1/list`
				const response = await fetch(url)
				if (response.ok) {
					// Handle both old array format (fallback) and new object format
					const rawData = await response.json()
					let list: LowerThird[] = []
					let newActiveId: number | null = null

					if (Array.isArray(rawData)) {
						list = rawData
					} else {
						const data = rawData as APIResponse
						list = data.list
						newActiveId = data.activeId
					}

					this.updateStatus(InstanceStatus.Ok)
					
					// Check for status change
					if (this.activeId !== newActiveId) {
						this.activeId = newActiveId
						this.checkFeedbacks('active_lower_third', 'hide_active')
					}

					this.updateVariables(list, newActiveId)
				} else {
					this.updateStatus(InstanceStatus.ConnectionFailure, `HTTP ${response.status}`)
				}
			} catch (e: any) {
				this.updateStatus(InstanceStatus.ConnectionFailure, e.toString())
			}
		}

		this.pollInterval = setInterval(poll, 2000)
		poll() // Run immediately
	}

	stopPolling(): void {
		if (this.pollInterval) clearInterval(this.pollInterval)
		this.pollInterval = undefined
	}

	updateVariables(data: LowerThird[], activeId: number | null): void {
		const values: { [variableId: string]: string | undefined } = {}
		
		values['active_id'] = activeId !== null ? activeId.toString() : '-'

		// Clear/Set variables for 1-99
		for (let i = 1; i <= 99; i++) {
			const item = data.find(d => d.id === i)
			values[`name_${i}`] = item ? item.name : '-'
			values[`title_${i}`] = item ? item.title : '-'
		}
		
		this.setVariableValues(values)
	}
}

runEntrypoint(ModuleInstance, [])
