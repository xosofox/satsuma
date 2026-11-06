import {readFile, writeFile, mkdir} from 'node:fs/promises';

// Classic inline scripts also work with file://: the demo needs no server or CDN.
const html = await readFile('index.html', 'utf8');
const bundle = (await readFile('dist/Satsuma.js', 'utf8')).replace(
    /^\/\/# sourceMappingURL=.*$/gm,
    '',
);
const example = (await readFile('src/example/example.js', 'utf8')).replace(
    /^import .*;\n/m,
    'const {Satsuma} = window.Satsuma;\n',
);
const script = `<script>${bundle.replace(/<\/script/gi, '<\\/script')}</script>\n<script type="text/javascript">{\n${example}\n}</script>`;
await mkdir('demo', {recursive: true});
await writeFile(
    'demo/index.html',
    html.replace(
        '<script type="module" src="/src/example/example.js"></script>',
        script,
    ),
);
