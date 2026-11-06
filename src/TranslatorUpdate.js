export default class TranslatorUpdate {
    scale = 1;
    clientX = undefined;
    clientY = undefined;

    constructor(params) {
        const defaults = {
            scale: 1,
            clientX: undefined,
            clientY: undefined,
        };

        params = Object.assign({}, defaults, params);
        this.scale = params.scale;
        this.clientX = params.clientX;
        this.clientY = params.clientY;

        Object.keys(params).forEach((key) => {
            if (!(key in defaults)) {
                console.warn('Unknown key ' + key);
            }
        });
    }
}
