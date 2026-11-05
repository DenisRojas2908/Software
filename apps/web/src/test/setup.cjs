// Se ejecuta antes de cada archivo de prueba de la web.
require('@testing-library/jest-dom');
const util = require('node:util');
// react-router necesita TextEncoder, que jsdom no trae.
Object.assign(globalThis, { TextEncoder: util.TextEncoder, TextDecoder: util.TextDecoder });
