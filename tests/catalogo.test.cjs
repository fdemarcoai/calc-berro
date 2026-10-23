const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const contexto = vm.createContext({ document: { addEventListener() {} } });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../calculo-original.js'), 'utf8'), contexto);
const evaluar = codigo => vm.runInContext(codigo, contexto);

test('el catálogo conserva tándem de 2, 3 y 4 y retira los de 5, 6 y 8', () => {
  assert.equal(evaluar('Object.keys(preciosEmpaques).length'), 27);
  for (const asientos of [2, 3, 4]) {
    assert.equal(evaluar(`Object.hasOwn(preciosEmpaques, "Tandem de ${asientos} asientos")`), true);
  }
  for (const asientos of [5, 6, 8]) {
    assert.equal(evaluar(`Object.hasOwn(preciosEmpaques, "Tandem de ${asientos} asientos")`), false);
  }
});

test('escalera multiuso tiene la tarifa, traslado e impuestos del bulto de estantería', () => {
  assert.equal(evaluar('preciosEmpaques["Escalera multiuso"].precio'), 354);
  assert.equal(evaluar('preciosEmpaques["Escalera multiuso"].envio'), 350);
  for (const cantidad of [1, 2, 5]) {
    const escalera = evaluar(`calcularProducto("Escalera multiuso", ${cantidad})`);
    assert.equal(escalera, evaluar(`calcularProducto("Bulto estantería (parantes, estantes)", ${cantidad})`));
    assert.equal(escalera, 354 * 1.22 * 1.25 * cantidad);
  }
});

test('pórticos se cobran en paquetes completos de hasta dos unidades por línea', () => {
  for (const [unidades, paquetes] of [[0, 0], [1, 1], [2, 1], [3, 2], [4, 2], [5, 3]]) {
    assert.equal(evaluar(`cantidadFacturable("Pórtico", ${unidades})`), paquetes);
    assert.equal(evaluar(`calcularProducto("Pórtico", ${unidades})`), 728 * 1.22 * 1.25 * paquetes);
    assert.match(evaluar(`detalleEmpaque("Pórtico", ${unidades})`), new RegExp(`^${paquetes} paquete`));
  }
  // Las líneas duplicadas mantienen su empaque independiente.
  assert.equal(evaluar('calcularProducto("Pórtico", 1) + calcularProducto("Pórtico", 1)'), 2220.4);
});

test('las medidas son inclusivas y las claves anteriores siguen siendo válidas', () => {
  assert.equal(evaluar('nombreProducto("Escritorio chico")'), 'Escritorio chico');
  assert.equal(evaluar('nombreProducto("Escritorio grande")'), 'Escritorio grande');
  assert.equal(evaluar('nombreProducto("Pórtico")'), 'Pórtico');
  assert.equal(evaluar('preciosEmpaques["Escritorio chico"].medida'), 'Hasta 1,20 m inclusive');
  assert.equal(evaluar('preciosEmpaques["Escritorio grande"].medida'), 'Más de 1,20 m');
  assert.equal(evaluar('calcularProducto("Escritorio chico", 2)'), 923 * 1.22 * 1.25 * 2);
  assert.equal(evaluar('calcularProducto("Escritorio grande", 2)'), 1298 * 1.22 * 1.25 * 2);
});

test('se conservan las excepciones de impuestos y moneda', () => {
  assert.equal(evaluar('calcularProducto("Súper Útil (3 bultos)", 2)'), 3000);
  assert.equal(evaluar('calcularProducto("Armario Xl", 2)'), 8400);
  assert.equal(evaluar('calcularProducto("Airbox", 2)'), 160);
  assert.equal(evaluar('preciosEmpaques.Airbox.moneda'), 'USD');
  assert.equal(evaluar('preciosEmpaques.Airbox.envio'), 0);
});


test('todos los nombres visibles llevan mayúscula solo en la primera letra', () => {
  const nombres = evaluar('Object.keys(preciosEmpaques).map(nombreProducto)');
  for (const nombre of nombres) {
    assert.equal(nombre[0], nombre[0].toLocaleUpperCase('es'));
    assert.equal(nombre.slice(1), nombre.slice(1).toLocaleLowerCase('es'));
  }
  assert.equal(evaluar('nombreProducto("Súper Útil (3 bultos)")'), 'Súper útil (3 bultos)');
  assert.equal(evaluar('nombreProducto("Armarios metálicos Desarmados")'), 'Armarios metálicos desarmados');
  assert.equal(evaluar('nombreProducto("Armario Xl")'), 'Armario xl');
});
