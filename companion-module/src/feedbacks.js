const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	const choices = self.getLowerThirdChoices()
	const defaultId = choices.length > 0 ? choices[0].id : 0

	// Add "Any" option at the beginning for active_state feedback
	const choicesWithAny = [{ id: 0, label: '(Any lower third)' }, ...choices.filter((c) => c.id !== 0)]

	self.setFeedbackDefinitions({
		active_state: {
			name: 'Lower Third Active',
			type: 'boolean',
			label: 'Lower Third Active State',
			description: 'Changes style when a specific lower third is active',
			defaultStyle: {
				bgcolor: combineRgb(0, 200, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'id',
					type: 'dropdown',
					label: 'Lower Third',
					choices: choicesWithAny,
					default: 0,
				},
			],
			callback: (feedback) => {
				const checkId = parseInt(feedback.options.id, 10)
				if (checkId === 0) {
					return self.activeId !== null
				}
				return self.activeId === checkId
			},
		},
		inactive_state: {
			name: 'Lower Third Inactive',
			type: 'boolean',
			label: 'Lower Third Inactive State',
			description: 'Changes style when no lower third is active',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				return self.activeId === null
			},
		},
	})
}
