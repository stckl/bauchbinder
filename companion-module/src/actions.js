module.exports = function (self) {
	const choices = self.getLowerThirdChoices()
	const defaultId = choices.length > 0 ? choices[0].id : 0

	self.setActionDefinitions({
		show_lowerthird: {
			name: 'Show Lower Third',
			description: 'Show a lower third by selection',
			options: [
				{
					id: 'id',
					type: 'dropdown',
					label: 'Lower Third',
					choices: choices,
					default: defaultId,
				},
			],
			callback: async (event) => {
				const id = parseInt(event.options.id, 10)
				if (id > 0) {
					await self.showLowerThird(id)
				}
			},
		},
		show_lowerthird_id: {
			name: 'Show Lower Third (by ID)',
			description: 'Show a lower third by numeric ID',
			options: [
				{
					id: 'id',
					type: 'number',
					label: 'Lower Third ID',
					default: 1,
					min: 1,
					max: 100,
				},
			],
			callback: async (event) => {
				await self.showLowerThird(event.options.id)
			},
		},
		hide_lowerthird: {
			name: 'Hide Lower Third',
			description: 'Hide the currently active lower third',
			options: [],
			callback: async () => {
				await self.hideLowerThird()
			},
		},
		toggle_lowerthird: {
			name: 'Toggle Lower Third',
			description: 'Show lower third if hidden, hide if shown',
			options: [
				{
					id: 'id',
					type: 'dropdown',
					label: 'Lower Third',
					choices: choices,
					default: defaultId,
				},
			],
			callback: async (event) => {
				const id = parseInt(event.options.id, 10)
				if (id > 0) {
					if (self.activeId === id) {
						await self.hideLowerThird()
					} else {
						await self.showLowerThird(id)
					}
				}
			},
		},
	})
}
