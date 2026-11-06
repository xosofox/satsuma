export default class Translator {
    x = 0;
    y = 0;
    scale = 1;
    tempX = 0;
    tempY = 0;
    tempScale = 1;
    MIN_SCALE = 0.1;
    MAX_SCALE = 8;

    constructor(container, content) {
        this.container = container;
        this.content = content;
    }

    start(start) {
        this.reset();
        this.startScreenX = start.clientX;
        this.startScreenY = start.clientY;
        // Account for content layout offsets as well as container borders.
        const rect = this.content
            ? this.content.getBoundingClientRect()
            : {left: this.x, top: this.y};
        this.originX = rect.left - this.x;
        this.originY = rect.top - this.y;
    }

    update(update) {
        const factor = update.scale === undefined ? 1 : update.scale;
        if (!Number.isFinite(factor) || factor <= 0) return;
        this.tempScale = Math.max(
            this.MIN_SCALE,
            Math.min(this.MAX_SCALE, this.scale * factor),
        );
        const ratio = this.tempScale / this.scale;
        const clientX =
            update.clientX === undefined ? this.startScreenX : update.clientX;
        const clientY =
            update.clientY === undefined ? this.startScreenY : update.clientY;
        // Keep the initial content point under the moving gesture midpoint.
        this.tempX =
            clientX -
            this.originX -
            (this.startScreenX - this.originX - this.x) * ratio;
        this.tempY =
            clientY -
            this.originY -
            (this.startScreenY - this.originY - this.y) * ratio;
    }

    done() {
        this.x = this.tempX;
        this.y = this.tempY;
        this.scale = this.tempScale;
    }

    reset() {
        this.tempX = this.x;
        this.tempY = this.y;
        this.tempScale = this.scale;
    }

    getValues() {
        return {x: this.x, y: this.y, scale: this.scale};
    }

    getTransform() {
        return `translate(${this.tempX}px, ${this.tempY}px) scale(${this.tempScale})`;
    }
}
