import Translator from './Translator.js';

export class Satsuma {
    constructor(container, content) {
        this.container = container;
        this.content = content;
        this.pointers = new Map();
        this.listeners = [];
        this.previousStyles = {
            touchAction: container.style.touchAction,
            overflow: container.style.overflow,
            transformOrigin: content.style.transformOrigin,
            transform: content.style.transform,
        };
        container.style.touchAction = 'none';
        container.style.overflow = 'hidden';
        content.style.transformOrigin = '0 0';
        this.translator = new Translator(container, content);
        this.addListeners();
    }

    listen(target, type, callback, options) {
        target.addEventListener(type, callback, options);
        this.listeners.push(() =>
            target.removeEventListener(type, callback, options),
        );
    }

    gesture() {
        const points = Array.from(this.pointers.values()).slice(0, 2);
        if (points.length === 1) return {...points[0], distance: 0};
        return {
            clientX: (points[0].clientX + points[1].clientX) / 2,
            clientY: (points[0].clientY + points[1].clientY) / 2,
            distance: this.calcTouchDistance(points[0], points[1]),
        };
    }

    restart() {
        this.translator.done();
        if (!this.pointers.size) return;
        const gesture = this.gesture();
        this.distance = gesture.distance;
        this.translator.start(gesture);
    }

    addListeners() {
        this.listen(this.container, 'pointerdown', (ev) => {
            if (ev.button !== 0) return;
            if (!this.pointers.size) {
                this.suppressClick = false;
                this.pressX = ev.clientX;
                this.pressY = ev.clientY;
            } else {
                this.suppressClick = true;
            }
            this.pointers.set(ev.pointerId, {
                clientX: ev.clientX,
                clientY: ev.clientY,
            });
            // Document listeners preserve native clicks on buttons and links.
            this.restart();
        });
        this.listen(
            this.container,
            'click',
            (ev) => {
                if (!this.suppressClick || ev.detail === 0) return;
                ev.preventDefault();
                ev.stopImmediatePropagation();
                this.suppressClick = false;
            },
            true,
        );
        const doc = this.container.ownerDocument;
        this.listen(doc, 'pointermove', (ev) => {
            if (!this.pointers.has(ev.pointerId)) return;
            if (
                Math.hypot(ev.clientX - this.pressX, ev.clientY - this.pressY) >
                4
            ) {
                this.suppressClick = true;
            }
            this.pointers.set(ev.pointerId, {
                clientX: ev.clientX,
                clientY: ev.clientY,
            });
            const gesture = this.gesture();
            this.translator.update({
                ...gesture,
                scale: this.distance > 0 ? gesture.distance / this.distance : 1,
            });
            if (gesture.distance > 0 && !this.distance) this.restart();
            this.drag();
        });
        const end = (ev) => {
            if (!this.pointers.delete(ev.pointerId)) return;
            this.restart();
        };
        this.listen(doc, 'pointerup', end);
        this.listen(doc, 'pointercancel', end);
        this.listen(doc.defaultView, 'blur', () => {
            this.pointers.clear();
            this.translator.done();
        });
        this.listen(this.container, 'dragstart', (ev) => ev.preventDefault());
        this.listen(this.container, 'selectstart', (ev) => ev.preventDefault());
        this.listen(
            this.container,
            'wheel',
            (ev) => {
                ev.preventDefault();
                if (
                    this.pointers.size ||
                    !Number.isFinite(ev.deltaY) ||
                    ev.deltaY === 0
                )
                    return;
                const unit =
                    ev.deltaMode === 1
                        ? 16
                        : ev.deltaMode === 2
                          ? this.container.clientHeight
                          : 1;
                this.translator.start(ev);
                this.translator.update({
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    scale: Math.exp(
                        Math.max(-10, Math.min(10, -ev.deltaY * unit * 0.002)),
                    ),
                });
                this.translator.done();
                this.drag();
            },
            {passive: false},
        );
    }

    drag() {
        this.content.style.transform = this.translator.getTransform();
    }

    calcTouchDistance(a, b) {
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }

    destroy() {
        this.listeners.forEach((remove) => remove());
        this.listeners = [];
        this.pointers.clear();
        this.container.style.touchAction = this.previousStyles.touchAction;
        this.container.style.overflow = this.previousStyles.overflow;
        this.content.style.transformOrigin =
            this.previousStyles.transformOrigin;
        this.content.style.transform = this.previousStyles.transform;
    }
}
