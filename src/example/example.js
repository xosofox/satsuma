import {Satsuma} from '../Satsuma.js';

const container = document.getElementById('container');
const content = document.getElementById('dragthing');
const satsuma = new Satsuma(container, content);
document.getElementById('reset').addEventListener('click', () => {
    satsuma.reset();
});
document.getElementById('marker').addEventListener('click', () => {
    document.getElementById('status').textContent = 'Marker clicked!';
});
