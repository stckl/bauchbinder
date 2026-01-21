"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionId = void 0;
exports.GetActions = GetActions;
var ActionId;
(function (ActionId) {
    ActionId["Show"] = "show";
    ActionId["Hide"] = "hide";
})(ActionId || (exports.ActionId = ActionId = {}));
function GetActions(instance) {
    const sendRequest = async (path) => {
        const url = `http://${instance.config.host}:${instance.config.port}${path}`;
        try {
            const response = await fetch(url, { method: 'POST' });
            if (!response.ok) {
                instance.log('error', `HTTP Error: ${response.status} ${response.statusText}`);
            }
        }
        catch (e) {
            instance.log('error', `Connection Error: ${e.toString()}`);
        }
    };
    return {
        [ActionId.Show]: {
            name: 'Show Lower Third',
            options: [
                {
                    type: 'number',
                    label: 'ID (1-9)',
                    id: 'id',
                    default: 1,
                    min: 1,
                    max: 99,
                },
            ],
            callback: async (event) => {
                const id = event.options.id;
                await sendRequest(`/v1/show/${id}`);
            },
        },
        [ActionId.Hide]: {
            name: 'Hide Lower Third',
            options: [],
            callback: async () => {
                await sendRequest(`/v1/hide`);
            },
        },
    };
}
