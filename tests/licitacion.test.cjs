const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function cotizador(filas) {
  const elementos = {
    'modo-licitacion': { checked: false },
    envioMonto: { textContent: '' },
    totalMonto: { textContent: '' },
  };
  const contexto = vm.createContext({
    document: {
      addEventListener() {},
      getElementById: id => elementos[id],
      querySelectorAll: () => filas.map(([producto, cantidad]) => ({
        querySelector: selector => ({ value: selector === '.empaque' ? producto : String(cantidad) }),
      })),
    },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../calculo-original.js'), 'utf8'), contexto);
  return licitacion => {
    elementos['modo-licitacion'].checked = licitacion;
    vm.runInContext('calcular()', contexto);
    return { total: elementos.totalMonto.textContent, traslado: elementos.envioMonto.textContent };
  };
}

test('licitación quita una sola vez los $350 y desactivarla recupera el total', () => {
  const calcular = cotizador([['Armario 1,90', 2], ['Silla de oficina', 3]]);
  const normal = calcular(false);
  const licitacion = calcular(true);
  assert.equal(normal.traslado, '$ 350.00');
  assert.equal(licitacion.traslado, '$ 0.00');
  assert.equal(Number(normal.total.slice(2)) - Number(licitacion.total.slice(2)), 350);
  assert.deepEqual(calcular(true), licitacion);
  assert.deepEqual(calcular(false), normal);
});

test('licitación respeta productos sin traslado, USD y cotizaciones vacías', () => {
  for (const [filas, total] of [
    [[], '$ 0.00'],
    [[['Armario 1,90', 0]], '$ 0.00'],
    [[['Súper Útil (3 bultos)', 2]], '$ 3000.00'],
    [[['Armario Xl', 1]], '$ 4200.00'],
    [[['Airbox', 1]], 'USD 80.00'],
    [[['Airbox', 1], ['Armario 1,90', 1]], 'USD 80.00'],
  ]) {
    const calcular = cotizador(filas);
    assert.equal(calcular(false).total, total);
    assert.equal(calcular(true).total, total);
  }
});
