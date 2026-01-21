"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetConfigFields = GetConfigFields;
const base_1 = require("@companion-module/base");
function GetConfigFields() {
    return [
        {
            type: 'textinput',
            id: 'host',
            label: 'Target IP',
            width: 8,
            regex: base_1.Regex.IP,
            default: '127.0.0.1',
        },
        {
            type: 'number',
            id: 'port',
            label: 'Target Port',
            width: 4,
            min: 1,
            max: 65535,
            default: 5001,
        },
    ];
}
