import {test} from 'node:test';
import assert from 'node:assert/strict';
import Translator from '../src/Translator.js';
import {Satsuma} from '../src/Satsuma.js';
class Surface {
    style = {touchAction: '', overflow: '', transformOrigin: '', transform: ''};
    listeners = new Map();
    clientHeight = 400;
    addEventListener(type, fn) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type).add(fn);
    }
    removeEventListener(type, fn) {
        this.listeners.get(type).delete(fn);
    }
    emit(type, values = {}) {
        const ev = {button: 0, preventDefault() {}, ...values};
        for (const fn of this.listeners.get(type) || []) fn(ev);
    }
}
function setup() {
    const container = new Surface();
    container.ownerDocument = new Surface();
    container.ownerDocument.defaultView = new Surface();
    const content = new Surface();
    content.getBoundingClientRect = () => ({
        left: 120 + s.translator.tempX,
        top: 70 + s.translator.tempY,
    });
    const s = new Satsuma(container, content);
    return {s, container, doc: container.ownerDocument};
}
test('pan accepts coordinates at zero', () => {
    const t = new Translator();
    t.start({clientX: 5, clientY: 5});
    t.update({clientX: 10, clientY: 0});
    t.done();
    assert.equal(t.x, 5);
    assert.equal(t.y, -5);
});
test('zoom anchors after previous pan and zoom, including layout offsets', () => {
    const {s, container} = setup();
    for (let i = 0; i < 3; i++)
        container.emit('wheel', {
            clientX: 220,
            clientY: 170,
            deltaY: -100,
            deltaMode: 0,
        });
    const t = s.translator;
    assert.ok(Math.abs((220 - 120 - t.x) / t.scale - 100) < 1e-10);
    assert.ok(Math.abs((170 - 70 - t.y) / t.scale - 100) < 1e-10);
});
test('scale clamps using actual ratio and zero wheel stays finite', () => {
    const {s, container} = setup();
    container.emit('wheel', {clientX: 220, clientY: 170, deltaY: -10000});
    assert.equal(s.translator.scale, 8);
    assert.equal(s.translator.x, -700);
    container.emit('wheel', {clientX: 220, clientY: 170, deltaY: 0});
    assert.equal(s.translator.scale, 8);
    container.emit('wheel', {clientX: 220, clientY: 170, deltaY: 10000});
    assert.equal(s.translator.scale, 0.1);
});
test('pinch midpoint pans, zooms and continues with remaining finger', () => {
    const {s, container, doc} = setup();
    container.emit('pointerdown', {pointerId: 1, clientX: 120, clientY: 70});
    container.emit('pointerdown', {pointerId: 2, clientX: 220, clientY: 70});
    doc.emit('pointermove', {pointerId: 2, clientX: 320, clientY: 70});
    assert.equal(s.translator.tempScale, 2);
    assert.equal(s.translator.tempX, 0);
    doc.emit('pointerup', {pointerId: 2});
    doc.emit('pointermove', {pointerId: 1, clientX: 140, clientY: 90});
    doc.emit('pointerup', {pointerId: 1});
    assert.equal(s.translator.scale, 2);
    assert.equal(s.translator.x, 20);
    assert.equal(s.translator.y, 20);
});
test('cancellation, blur and destroy clean up gestures and listeners', () => {
    const {s, container, doc} = setup();
    container.emit('pointerdown', {pointerId: 1, clientX: 1, clientY: 1});
    doc.emit('pointercancel', {pointerId: 1});
    assert.equal(s.pointers.size, 0);
    container.emit('pointerdown', {pointerId: 2, clientX: 1, clientY: 1});
    doc.defaultView.emit('blur');
    assert.equal(s.pointers.size, 0);
    s.destroy();
    for (const target of [container, doc, doc.defaultView])
        for (const listeners of target.listeners.values())
            assert.equal(listeners.size, 0);
    assert.equal(container.style.touchAction, '');
});

test('zoom after panning keeps the same content point under the cursor', () => {
    const {s, container, doc} = setup();
    container.emit('pointerdown', {pointerId: 1, clientX: 200, clientY: 150});
    doc.emit('pointermove', {pointerId: 1, clientX: 240, clientY: 180});
    doc.emit('pointerup', {pointerId: 1});
    const contentX = 220 - 120 - s.translator.x;
    const contentY = 170 - 70 - s.translator.y;
    container.emit('wheel', {clientX: 220, clientY: 170, deltaY: -200});
    const t = s.translator;
    assert.ok(Math.abs((220 - 120 - t.x) / t.scale - contentX) < 1e-10);
    assert.ok(Math.abs((170 - 70 - t.y) / t.scale - contentY) < 1e-10);
});

test('pinch can translate its midpoint without changing scale', () => {
    const {s, container, doc} = setup();
    container.emit('pointerdown', {pointerId: 1, clientX: 120, clientY: 70});
    container.emit('pointerdown', {pointerId: 2, clientX: 220, clientY: 70});
    doc.emit('pointermove', {pointerId: 1, clientX: 140, clientY: 90});
    doc.emit('pointermove', {pointerId: 2, clientX: 240, clientY: 90});
    assert.equal(s.translator.tempScale, 1);
    assert.equal(s.translator.tempX, 20);
    assert.equal(s.translator.tempY, 20);
});

test('line and pixel wheel deltas use the same zoom factor', () => {
    const a = setup();
    const b = setup();
    a.container.emit('wheel', {
        clientX: 200,
        clientY: 200,
        deltaY: -1,
        deltaMode: 1,
    });
    b.container.emit('wheel', {
        clientX: 200,
        clientY: 200,
        deltaY: -16,
        deltaMode: 0,
    });
    assert.equal(a.s.translator.scale, b.s.translator.scale);
});

test('secondary mouse button does not start a gesture', () => {
    const {s, container} = setup();
    container.emit('pointerdown', {
        button: 2,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
    });
    assert.equal(s.pointers.size, 0);
});
