const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function interfaz(selects = []) {
  const elemento = { addEventListener() {} };
  const contexto = vm.createContext({
    document: {
      addEventListener() {},
      getElementById: () => elemento,
      querySelector: () => elemento,
      querySelectorAll: () => selects,
    },
    window: { addEventListener() {} },
  });
  for (const archivo of ['calculo-original.js', 'script.js', 'ventas.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8'), contexto);
  }
  return codigo => vm.runInContext(codigo, contexto);
}

test('cada selector excluye los productos elegidos en otras líneas y los libera al quitarlos', () => {
  const opciones = () => ['', 'Pórtico', 'Silla de oficina'].map(value => ({ value, disabled: false }));
  const seleccion = { value: 'Pórtico', options: opciones() };
  const nueva = { value: '', options: opciones() };
  const evaluar = interfaz([seleccion, nueva]);
  evaluar('actualizarOpcionesDisponibles()');
  assert.equal(seleccion.options[1].disabled, false);
  assert.equal(nueva.options[1].disabled, true);
  assert.equal(nueva.options[2].disabled, false);
  assert.equal(nueva.options[0].disabled, false);
  seleccion.value = '';
  evaluar('actualizarOpcionesDisponibles()');
  assert.equal(nueva.options[1].disabled, false);
});

test('recuperar cotizaciones une productos repetidos antes de cobrar por pares', () => {
  const evaluar = interfaz();
  const filas = [
    { producto: 'Pórtico', cantidad: '1' },
    { producto: 'Silla de oficina', cantidad: '3' },
    { producto: 'Pórtico', cantidad: '1' },
    { producto: 'Silla de oficina', cantidad: '2' },
  ];
  const resultado = JSON.parse(evaluar(`JSON.stringify(adaptarFilasAlCatalogo(${JSON.stringify(filas)}))`));
  assert.deepEqual(resultado, [
    { producto: filas[0].producto, cantidad: '2' },
    { producto: 'Silla de oficina', cantidad: '5' },
  ]);
  assert.equal(evaluar(`calcularProducto(${JSON.stringify(resultado[0].producto)}, 2)`), 728 * 1.22 * 1.25);
});
