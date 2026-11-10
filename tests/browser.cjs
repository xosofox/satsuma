const {chromium: playwright} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
(async () => {
    const browser = await playwright.launch({
        executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
        headless: true,
    });
    const context = await browser.newContext({
        viewport: {width: 1000, height: 850},
        hasTouch: true,
    });
    // Exercise the generated offline demo exactly as a user opens it.
    const demo = await context.newPage();
    const demoErrors = [];
    demo.on('pageerror', (e) => demoErrors.push(e.message));
    await demo.goto(pathToFileURL(path.resolve('demo/index.html')).href);
    await demo.locator('#marker').click();
    assert.equal(
        await demo.locator('#status').textContent(),
        'Marker clicked!',
    );
    await demo.locator('#reset').click();
    await demo.locator('#marker').click();
    assert.deepEqual(demoErrors, []);
    assert.equal(
        await demo
            .getByRole('heading', {name: 'Symfony AssetMapper', exact: true})
            .count(),
        1,
    );
    await demo.close();

    // Exercise the native ESM sources through browser HTTP requests, without bundling.
    const source = await context.newPage();
    const sourceErrors = [];
    source.on('pageerror', (e) => sourceErrors.push(e.message));
    await source.route('http://satsuma.test/**', async (route) => {
        const url = new URL(route.request().url());
        const relative =
            url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const file = path.resolve(relative);
        assert.ok(file.startsWith(process.cwd() + path.sep));
        await route.fulfill({
            body: fs.readFileSync(file),
            contentType: file.endsWith('.html')
                ? 'text/html'
                : 'text/javascript',
        });
    });
    await source.goto('http://satsuma.test/');
    await source.locator('#marker').click();
    assert.equal(
        await source.locator('#status').textContent(),
        'Marker clicked!',
    );
    assert.deepEqual(sourceErrors, []);
    await source.close();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setContent(
        fs
            .readFileSync('index.html', 'utf8')
            .replace(
                '<script type="module" src="/src/example/example.js"></script>',
                '',
            ),
    );
    await page.addScriptTag({path: 'dist/Satsuma.js'});
    await page.evaluate(() => {
        window.viewer = new Satsuma.Satsuma(
            document.querySelector('#container'),
            document.querySelector('#dragthing'),
        );
        window.clicks = 0;
        document.querySelector('#marker').onclick = () => window.clicks++;
    });
    const values = () =>
        page.evaluate(() => ({
            ...viewer.translator.getValues(),
            tempX: viewer.translator.tempX,
            tempY: viewer.translator.tempY,
            tempScale: viewer.translator.tempScale,
        }));
    const box = await page.locator('#container').boundingBox();
    const anchor = {x: box.x + 350, y: box.y + 250};
    const before = await page.locator('#dragthing').boundingBox();
    await page.mouse.move(anchor.x, anchor.y);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(80);
    assert.equal((await values()).scale, 1);
    assert.ok(await page.evaluate(() => window.scrollY > 0));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(anchor.x, anchor.y);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Control');
    await page.waitForTimeout(80);
    const after = await page.locator('#dragthing').boundingBox();
    const v = await values();
    assert.ok(
        Math.abs(anchor.x - before.x - (anchor.x - after.x) / v.scale) < 0.01,
    );
    await page.mouse.move(anchor.x, anchor.y);
    await page.mouse.down();
    await page.mouse.move(anchor.x + 80, anchor.y + 30, {steps: 5});
    await page.mouse.up();
    const pan = await values();
    assert.ok(Math.abs(pan.x - v.x - 80) < 0.01);
    assert.ok(Math.abs(pan.y - v.y - 30) < 0.01);
    await page.evaluate(() => {
        viewer.destroy();
        viewer = new Satsuma.Satsuma(
            document.querySelector('#container'),
            document.querySelector('#dragthing'),
            {scrollRequiresCtrlKey: false},
        );
    });
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(80);
    assert.ok((await values()).scale > 1);
    await page.evaluate(() => {
        viewer.destroy();
        viewer = new Satsuma.Satsuma(
            document.querySelector('#container'),
            document.querySelector('#dragthing'),
        );
    });
    await page.locator('#marker').click();
    assert.equal(await page.evaluate(() => clicks), 1);
    const marker = await page.locator('#marker').boundingBox();
    await page.mouse.move(marker.x + 20, marker.y + 15);
    await page.mouse.down();
    await page.mouse.move(marker.x + 50, marker.y + 25, {steps: 5});
    await page.mouse.up();
    assert.equal(await page.evaluate(() => clicks), 1);
    await page.evaluate(() => {
        viewer.destroy();
        viewer = new Satsuma.Satsuma(
            document.querySelector('#container'),
            document.querySelector('#dragthing'),
        );
    });
    const cdp = await context.newCDPSession(page);
    const a = {x: box.x + 160, y: box.y + 130, id: 1};
    const b = {x: box.x + 260, y: box.y + 130, id: 2};
    await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [a],
    });
    await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [a, b],
    });
    await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [a, {...b, x: b.x + 100}],
    });
    await page.waitForTimeout(80);
    const pinch = await values();
    assert.ok(Math.abs(pinch.tempScale - 2) < 0.01);
    await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [{...b, x: b.x + 100}],
    });
    await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{...a, x: a.x + 30, y: a.y + 20}],
    });
    await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
    });
    await page.waitForTimeout(100);
    const final = await values();
    assert.ok(Math.abs(final.x - pinch.tempX - 30) < 0.01);
    assert.ok(Math.abs(final.y - pinch.tempY - 20) < 0.01);
    assert.deepEqual(errors, []);
    console.log(
        'PASS: real Chromium wheel anchor, mouse drag, button click, drag click suppression, native two-touch pinch and remaining-finger pan, offline demo, native ESM sources.',
    );
    await browser.close();
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
