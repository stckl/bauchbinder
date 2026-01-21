"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPresets = GetPresets;
const actions_1 = require("./actions");
function GetPresets() {
    const presets = {};
    // Create presets for ID 1-10
    for (let i = 1; i <= 10; i++) {
        presets[`show_${i}`] = {
            type: 'button',
            category: 'Lower Thirds',
            name: `Show ${i}`,
            style: {
                text: `$(bauchbinder:name_${i})`,
                size: '14',
                color: 16777215,
                bgcolor: 0,
            },
            steps: [
                {
                    down: [
                        {
                            actionId: actions_1.ActionId.Show,
                            options: {
                                id: i,
                            },
                        },
                    ],
                    up: [],
                },
            ],
            feedbacks: [],
        };
    }
    // Hide Preset
    presets['hide'] = {
        type: 'button',
        category: 'Control',
        name: 'Hide All',
        style: {
            text: 'HIDE',
            size: '18',
            color: 16777215,
            bgcolor: 12582912, // Red
        },
        steps: [
            {
                down: [
                    {
                        actionId: actions_1.ActionId.Hide,
                        options: {},
                    }
                ],
                up: [],
            },
        ],
        feedbacks: [],
    };
    return presets;
}
