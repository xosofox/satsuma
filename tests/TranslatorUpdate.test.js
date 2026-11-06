import {test} from 'node:test';
import assert from 'node:assert/strict';
import TranslatorUpdate from '../src/TranslatorUpdate.js';

test('updates distinguish missing coordinates from zero', () => {
    const defaults = new TranslatorUpdate();
    assert.equal(defaults.scale, 1);
    assert.equal(defaults.clientX, undefined);
    assert.equal(defaults.clientY, undefined);
    const update = new TranslatorUpdate({clientX: 0, clientY: 34});
    assert.equal(update.clientX, 0);
    assert.equal(update.clientY, 34);
});

test('unknown update keys produce a warning', (t) => {
    const warn = t.mock.method(console, 'warn', () => {});
    new TranslatorUpdate({typoX: 34});
    assert.equal(warn.mock.calls[0].arguments[0], 'Unknown key typoX');
});
