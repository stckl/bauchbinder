const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')

class BauchbinderInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.pollTimer = null
		this.activeId = null
		this.lowerThirds = []
		this.lastChoicesJson = ''
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()

		this.startPolling()
	}

	async destroy() {
		this.stopPolling()
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		this.startPolling()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Bauchbinder IP',
				width: 8,
				default: '127.0.0.1',
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 4,
				default: '5001',
				regex: Regex.PORT,
			},
			{
				type: 'number',
				id: 'pollInterval',
				label: 'Poll Interval (ms)',
				width: 4,
				default: 1000,
				min: 250,
				max: 10000,
			},
		]
	}

	getBaseUrl() {
		const host = this.config.host || '127.0.0.1'
		const port = this.config.port || '5001'
		return `http://${host}:${port}`
	}

	getLowerThirdChoices() {
		const choices = this.lowerThirds.map((item) => ({
			id: item.id,
			label: `${item.id}: ${item.name}`,
		}))
		if (choices.length === 0) {
			choices.push({ id: 0, label: '(No lower thirds available)' })
		}
		return choices
	}

	startPolling() {
		this.stopPolling()
		const interval = this.config.pollInterval || 1000
		this.pollTimer = setInterval(() => this.poll(), interval)
		this.poll()
	}

	stopPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = null
		}
	}

	async poll() {
		try {
			const response = await fetch(`${this.getBaseUrl()}/v1/list`)
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`)
			}
			const data = await response.json()

			this.activeId = data.activeId
			this.lowerThirds = data.list || []

			this.updateStatus(InstanceStatus.Ok)
			this.checkFeedbacks('active_state', 'inactive_state')
			this.updateVariables()
			this.updateChoicesIfChanged()
		} catch (error) {
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
			this.activeId = null
			this.lowerThirds = []
			this.checkFeedbacks('active_state', 'inactive_state')
			this.updateVariables()
			this.updateChoicesIfChanged()
		}
	}

	updateChoicesIfChanged() {
		const choicesJson = JSON.stringify(this.lowerThirds)
		if (choicesJson !== this.lastChoicesJson) {
			this.lastChoicesJson = choicesJson
			this.updateActions()
			this.updateFeedbacks()
		}
	}

	updateVariables() {
		const activeItem = this.lowerThirds.find((item) => item.id === this.activeId)
		this.setVariableValues({
			active_id: this.activeId ?? 'none',
			active_name: activeItem?.name ?? '',
			active_title: activeItem?.title ?? '',
			item_count: this.lowerThirds.length,
			is_active: this.activeId !== null ? 'true' : 'false',
		})
	}

	async showLowerThird(id) {
		try {
			const response = await fetch(`${this.getBaseUrl()}/v1/show/${id}`, { method: 'POST' })
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`)
			}
			this.poll()
		} catch (error) {
			this.log('error', `Failed to show lower third: ${error.message}`)
		}
	}

	async hideLowerThird() {
		try {
			const response = await fetch(`${this.getBaseUrl()}/v1/hide`, { method: 'POST' })
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`)
			}
			this.poll()
		} catch (error) {
			this.log('error', `Failed to hide lower third: ${error.message}`)
		}
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	updatePresets() {
		UpdatePresets(this)
	}
}

runEntrypoint(BauchbinderInstance, UpgradeScripts)
