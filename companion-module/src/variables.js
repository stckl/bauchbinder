module.exports = function (self) {
	const variables = [
		{ variableId: 'active_id', name: 'Active Lower Third ID' },
		{ variableId: 'active_name', name: 'Active Lower Third Name' },
		{ variableId: 'active_title', name: 'Active Lower Third Title' },
		{ variableId: 'item_count', name: 'Total Lower Thirds Count' },
		{ variableId: 'is_active', name: 'Is Any Lower Third Active' },
	]

	// Variables for slots 1-20
	for (let i = 1; i <= 20; i++) {
		variables.push({ variableId: `slot_${i}_name`, name: `Slot ${i} Name` })
		variables.push({ variableId: `slot_${i}_title`, name: `Slot ${i} Title` })
	}

	self.setVariableDefinitions(variables)
}
