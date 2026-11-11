const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const leer = archivo => fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8');

// DOM mínimo: prueba el renderizado y los eventos propios, no emula el navegador.
function interfaz() {
  class Elemento {
    constructor() { this.children = []; this.textContent = ''; this.events = {}; }
    addEventListener(tipo, fn) { this.events[tipo] = fn; }
    emitir(tipo, datos = {}) { this.events[tipo]?.(datos); }
    append(...elementos) { this.children.push(...elementos); }
    appendChild(elemento) { this.append(elemento); }
    replaceChildren() { this.children = []; }
    showModal() { this.open = true; }
    close() { this.open = false; this.emitir('close'); }
    focus() { this.enfocado = true; }
    getBoundingClientRect() { return { left: 20, right: 720, top: 20, bottom: 600 }; }
  }
  const ids = Object.fromEntries(['abrir-tarifas', 'cerrar-tarifas', 'tarifas-productos', 'filas-tarifas'].map(id => [id, new Elemento()]));
  const clases = new Set();
  const contexto = vm.createContext({ document: {
    addEventListener() {}, getElementById: id => ids[id], createElement: () => new Elemento(),
    body: { classList: { add: c => clases.add(c), remove: c => clases.delete(c) } },
  } });
  vm.runInContext(leer('calculo-original.js') + '\n' + leer('tabla-tarifas.js'), contexto);
  return { ids, clases, evaluar: codigo => vm.runInContext(codigo, contexto), abrir: () => ids['abrir-tarifas'].emitir('click') };
}

test('renderiza una fila por producto, ordenada, con importe y moneda del catálogo', () => {
  const ui = interfaz();
  const antes = ui.evaluar('JSON.stringify(preciosEmpaques)');
  ui.abrir();
  const esperado = JSON.parse(ui.evaluar('JSON.stringify(Object.keys(preciosEmpaques).sort((a,b) => nombreProducto(a).localeCompare(nombreProducto(b), "es", {sensitivity:"base"})).map(k => [nombreProducto(k), `${preciosEmpaques[k].moneda || "$"} ${preciosEmpaques[k].precio.toFixed(2)}`]))'));
  const filas = () => ui.ids['filas-tarifas'].children;
  assert.equal(filas().length, 27);
  assert.deepEqual(filas().map(f => f.children.map(c => c.textContent)), esperado);
  ui.abrir();
  assert.equal(filas().length, 27, 'reabrir no duplica filas');
  assert.equal(ui.evaluar('JSON.stringify(preciosEmpaques)'), antes);
});

test('describe el paquete parcial de pórticos y conserva las medidas de escritorios', () => {
  const ui = interfaz(); ui.abrir();
  const detalle = nombre => ui.ids['filas-tarifas'].children.find(f => f.children[0].textContent === nombre).children[0].children[0].textContent;
  assert.equal(detalle('Pórtico'), 'Por paquete de hasta 2 unidades; se redondea por línea');
  assert.equal(detalle('Escritorio chico'), 'Hasta 1,20 m inclusive');
  assert.equal(detalle('Escritorio grande'), 'Más de 1,20 m');
  assert.equal(ui.evaluar('calcularProducto("Pórtico", 1)'), ui.evaluar('calcularProducto("Pórtico", 2)'));
  assert.equal(ui.evaluar('calcularProducto("Pórtico", 3)'), 2220.4);
});

test('cierra con botón y clic exterior; limpia el bloqueo y devuelve el foco', () => {
  const ui = interfaz(); const dialogo = ui.ids['tarifas-productos'];
  ui.abrir(); assert.equal(ui.clases.has('tarifas-abiertas'), true);
  dialogo.emitir('click', { target: dialogo, clientX: 30, clientY: 30 });
  assert.equal(dialogo.open, true);
  dialogo.emitir('click', { target: dialogo, clientX: 0, clientY: 0 });
  assert.equal(dialogo.open, false);
  assert.equal(ui.clases.has('tarifas-abiertas'), false);
  assert.equal(ui.ids['abrir-tarifas'].enfocado, true);
  ui.abrir(); ui.ids['cerrar-tarifas'].emitir('click');
  assert.equal(dialogo.open, false);
});

test('ambas entradas ofrecen la misma tabla accesible y aclaran el alcance del precio', () => {
  assert.equal(leer('index.html'), leer('Berro.html'));
  for (const archivo of ['index.html', 'Berro.html']) {
    const html = leer(archivo);
    assert.match(html, /class="tariff-table-scroll" tabindex="0" role="region" aria-label="Tabla de tarifas base de envío"/);
    assert.match(html, /no precios de los muebles ni una cotización final/);
    assert.match(html, /en modo Licitación omite el traslado a agencia/);
    assert.match(html, /aria-labelledby="titulo-tarifas" aria-describedby="nota-tarifas"/);
  }
});
