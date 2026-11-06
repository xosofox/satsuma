import {Satsuma} from '../Satsuma.js';

const container = document.getElementById('container');
const content = document.getElementById('dragthing');
let satsuma = new Satsuma(container, content);
document.getElementById('reset').addEventListener('click', () => {
    satsuma.destroy();
    satsuma = new Satsuma(container, content);
});
document.getElementById('marker').addEventListener('click', () => {
    document.getElementById('status').textContent = 'Marker angeklickt!';
});
