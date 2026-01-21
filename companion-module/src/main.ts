import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, ModuleConfig } from './config'
import { GetActions } from './actions'
import { GetPresets } from './presets'

interface LowerThird {
	id: number
	name: string
	title: string
}

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	public config: ModuleConfig = {
		host: '127.0.0.1',
		port: 5001,
	}

	private pollInterval: NodeJS.Timeout | undefined

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)

		this.setActionDefinitions(GetActions(this))
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
		for (let i = 1; i <= 99; i++) {
			variables.push({ variableId: `name_${i}`, name: `Name ${i}` })
			variables.push({ variableId: `title_${i}`, name: `Title ${i}` })
		}
		this.setVariableDefinitions(variables)
	}

	startPolling(): void {
		if (this.pollInterval) clearInterval(this.pollInterval)
		
		const poll = async () => {
			try {
				const url = `http://${this.config.host}:${this.config.port}/v1/list`
				const response = await fetch(url)
				if (response.ok) {
					const data = await response.json() as LowerThird[]
					this.updateStatus(InstanceStatus.Ok)
					this.updateVariables(data)
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

	updateVariables(data: LowerThird[]): void {
		const values: { [variableId: string]: string | undefined } = {}
		
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
