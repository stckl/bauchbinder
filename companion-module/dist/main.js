"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleInstance = void 0;
const base_1 = require("@companion-module/base");
const config_1 = require("./config");
const actions_1 = require("./actions");
const presets_1 = require("./presets");
class ModuleInstance extends base_1.InstanceBase {
    constructor(internal) {
        super(internal);
        this.config = {
            host: '127.0.0.1',
            port: 5001,
        };
        this.activeId = null;
    }
    async init(config) {
        this.config = config;
        this.updateStatus(base_1.InstanceStatus.Ok);
        this.setActionDefinitions((0, actions_1.GetActions)(this));
        this.initFeedbacks();
        this.setPresetDefinitions((0, presets_1.GetPresets)());
        this.initVariables();
        this.startPolling();
    }
    // Called when the configuration is updated
    async configUpdated(config) {
        this.config = config;
        this.updateStatus(base_1.InstanceStatus.Ok);
        this.stopPolling();
        this.startPolling();
    }
    // Return config fields for web config
    getConfigFields() {
        return (0, config_1.GetConfigFields)();
    }
    async destroy() {
        this.stopPolling();
    }
    initVariables() {
        const variables = [];
        variables.push({ variableId: 'active_id', name: 'Active Lower Third ID' });
        for (let i = 1; i <= 99; i++) {
            variables.push({ variableId: `name_${i}`, name: `Name ${i}` });
            variables.push({ variableId: `title_${i}`, name: `Title ${i}` });
        }
        this.setVariableDefinitions(variables);
    }
    initFeedbacks() {
        const feedbacks = {
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
                    return this.activeId === feedback.options.id;
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
                    return this.activeId === null;
                },
            }
        };
        this.setFeedbackDefinitions(feedbacks);
    }
    startPolling() {
        if (this.pollInterval)
            clearInterval(this.pollInterval);
        const poll = async () => {
            try {
                const url = `http://${this.config.host}:${this.config.port}/v1/list`;
                const response = await fetch(url);
                if (response.ok) {
                    // Handle both old array format (fallback) and new object format
                    const rawData = await response.json();
                    let list = [];
                    let newActiveId = null;
                    if (Array.isArray(rawData)) {
                        list = rawData;
                    }
                    else {
                        const data = rawData;
                        list = data.list;
                        newActiveId = data.activeId;
                    }
                    this.updateStatus(base_1.InstanceStatus.Ok);
                    // Check for status change
                    if (this.activeId !== newActiveId) {
                        this.activeId = newActiveId;
                        this.checkFeedbacks('active_lower_third', 'hide_active');
                    }
                    this.updateVariables(list, newActiveId);
                }
                else {
                    this.updateStatus(base_1.InstanceStatus.ConnectionFailure, `HTTP ${response.status}`);
                }
            }
            catch (e) {
                this.updateStatus(base_1.InstanceStatus.ConnectionFailure, e.toString());
            }
        };
        this.pollInterval = setInterval(poll, 2000);
        poll(); // Run immediately
    }
    stopPolling() {
        if (this.pollInterval)
            clearInterval(this.pollInterval);
        this.pollInterval = undefined;
    }
    updateVariables(data, activeId) {
        const values = {};
        values['active_id'] = activeId !== null ? activeId.toString() : '-';
        // Clear/Set variables for 1-99
        for (let i = 1; i <= 99; i++) {
            const item = data.find(d => d.id === i);
            values[`name_${i}`] = item ? item.name : '-';
            values[`title_${i}`] = item ? item.title : '-';
        }
        this.setVariableValues(values);
    }
}
exports.ModuleInstance = ModuleInstance;
(0, base_1.runEntrypoint)(ModuleInstance, []);
