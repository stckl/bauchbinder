const { combineRgb } = require('@companion-module/base')

module.exports = function (self) {
	const presets = {}

	// Preset: Hide Lower Third
	presets['hide'] = {
		type: 'button',
		category: 'Lower Thirds',
		name: 'Hide',
		style: {
			text: 'HIDE',
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [{ actionId: 'hide_lowerthird', options: {} }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'inactive_state',
				style: {
					bgcolor: combineRgb(200, 0, 0),
				},
			},
		],
	}

	// Presets: Show Lower Third 1-10
	for (let i = 1; i <= 10; i++) {
		presets[`show_${i}`] = {
			type: 'button',
			category: 'Lower Thirds',
			name: `Show ${i}`,
			style: {
				text: `${i}`,
				size: '24',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 100),
			},
			steps: [
				{
					down: [{ actionId: 'show_lowerthird_id', options: { id: i } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'active_state',
					options: { id: i },
					style: {
						bgcolor: combineRgb(0, 200, 0),
					},
				},
			],
		}
	}

	// Preset: Toggle Lower Third 1-10
	for (let i = 1; i <= 10; i++) {
		presets[`toggle_${i}`] = {
			type: 'button',
			category: 'Lower Thirds (Toggle)',
			name: `Toggle ${i}`,
			style: {
				text: `T${i}`,
				size: '24',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(100, 100, 0),
			},
			steps: [
				{
					down: [{ actionId: 'show_lowerthird_id', options: { id: i } }],
					up: [],
				},
				{
					down: [{ actionId: 'hide_lowerthird', options: {} }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'active_state',
					options: { id: i },
					style: {
						bgcolor: combineRgb(0, 200, 0),
					},
				},
			],
		}
	}

	self.setPresetDefinitions(presets)
}
