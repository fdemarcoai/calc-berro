// Acciones de ventas y persistencia local. Las tarifas y la fórmula están en calculo-original.js.
const nuevaCotizacion = document.getElementById("nueva-cotizacion");
const deshacerLimpieza = document.getElementById("deshacer-limpieza");
const copiarTotal = document.getElementById("copiar-total");
const estadoCotizacion = document.getElementById("estado-cotizacion");
const estadoGuardado = document.getElementById("estado-guardado");
const copiaManual = document.getElementById("copia-manual");
const textoCotizacion = document.getElementById("texto-cotizacion");
const listaProductos = document.getElementById("productos");
const claveCotizacion = "demarco.berro.cotizacion.v1";
const firmaCatalogo = JSON.stringify(preciosEmpaques);
const notaMoneda = document.getElementById("nota-moneda");
const modoLicitacion = document.getElementById("modo-licitacion");
let filasAntesDeLimpiar = null;
let licitacionAntesDeLimpiar = false;
let cotizacionLista = false;
let aplicandoFilas = false;

function leerFilas() {
  return [...listaProductos.querySelectorAll(".producto")].map(producto => ({
    producto: producto.querySelector(".empaque").value,
    cantidad: producto.querySelector(".cantidad").value,
  }));
}

function filasConImporte() {
  return leerFilas().filter(fila =>
    Object.hasOwn(preciosEmpaques, fila.producto) && parseInt(fila.cantidad, 10) > 0,
  );
}

function monedaProducto(fila) {
  return preciosEmpaques[fila.producto]?.moneda === "USD" ? "USD" : "$";
}

function hayMonedasMezcladas() {
  return new Set(filasConImporte().map(monedaProducto)).size > 1;
}

function dineroCentavos(centavos, moneda) {
  return `${moneda} ${(centavos / 100).toFixed(2)}`;
}

function actualizarDesglose() {
  // El total autoritativo lo calcula el código original, sin cambiar su prioridad USD.
  const textoTotal = document.getElementById("totalMonto").textContent.trim();
  const moneda = textoTotal.startsWith("USD") ? "USD" : "$";
  let base = 0;
  let baseConIva = 0;
  filasConImporte().filter(fila => monedaProducto(fila) === moneda).forEach(fila => {
    const config = preciosEmpaques[fila.producto];
    const cantidad = cantidadFacturable(fila.producto, parseInt(fila.cantidad, 10));
    base += config.precio * cantidad;
    let precioConIva = config.precio;
    if (!config.fijo && config.iva !== false) precioConIva *= iva;
    baseConIva += precioConIva * cantidad;
  });
  const centavos = importe => Math.round(Number(importe.toFixed(2)) * 100);
  const baseCentavos = centavos(base);
  const conIvaCentavos = centavos(baseConIva);
  const textoEnvio = document.getElementById("envioMonto").textContent;
  const agenciaCentavos = moneda === "USD" ? 0 : centavos(Number(textoEnvio.replace("$", "").trim()));
  const totalCentavos = centavos(Number(textoTotal.replace(moneda, "").trim()));
  document.getElementById("detalle-base").textContent = dineroCentavos(baseCentavos, moneda);
  document.getElementById("detalle-iva").textContent = dineroCentavos(conIvaCentavos - baseCentavos, moneda);
  document.getElementById("detalle-recargo").textContent = dineroCentavos(totalCentavos - agenciaCentavos - conIvaCentavos, moneda);
  document.getElementById("detalle-agencia").textContent = dineroCentavos(agenciaCentavos, moneda);
  document.getElementById("detalle-total").textContent = textoTotal;
  document.getElementById("tasa-iva").textContent = `(${Math.round((iva - 1) * 100)}%)`;
  document.getElementById("tasa-recargo").textContent = `(${Math.round((demarcoImpuesto - 1) * 100)}%)`;
}

function actualizarAcciones() {
  const hayProductos = filasConImporte().length > 0;
  const mezcladas = hayMonedasMezcladas();
  // No compartir una cotización que mezcle monedas y oculte importes en pesos.
  copiarTotal.disabled = !hayProductos || mezcladas;
  notaMoneda.hidden = !mezcladas;
  deshacerLimpieza.hidden = !filasAntesDeLimpiar;
  copiaManual.hidden = true;
  estadoCotizacion.textContent = mezcladas
    ? "Separá los productos por moneda para copiar la cotización."
    : hayProductos
      ? "Copiá productos, cantidades y total del envío para el presupuesto."
      : "Seleccioná un producto para copiar la cotización.";
  actualizarDesglose();
  document.getElementById("total-movil").textContent = document.getElementById("totalMonto").textContent.trim();
}

function guardarCotizacion() {
  if (!cotizacionLista || aplicandoFilas) return;
  try {
    localStorage.setItem(claveCotizacion, JSON.stringify({
      version: 1,
      catalogo: firmaCatalogo,
      filas: leerFilas(),
      licitacion: modoLicitacion.checked,
      deshacer: filasAntesDeLimpiar,
      deshacerLicitacion: licitacionAntesDeLimpiar,
    }));
    estadoGuardado.textContent = "Guardado en este navegador. Podés cerrar y retomar después.";
  } catch {
    estadoGuardado.textContent = "No se pudo guardar en este navegador. El cálculo sigue disponible mientras esta página esté abierta.";
  }
}

function validarFilas(filas) {
  return Array.isArray(filas) && filas.length > 0 && filas.every(fila =>
    fila && typeof fila.producto === "string" &&
    typeof fila.cantidad === "string" && /^[0-9]*$/.test(fila.cantidad),
  );
}

function adaptarFilasAlCatalogo(filas) {
  return filas.map(fila => ({
    producto: Object.hasOwn(preciosEmpaques, fila.producto) ? fila.producto : "",
    cantidad: fila.cantidad,
  }));
}

function aplicarFilas(filas) {
  aplicandoFilas = true;
  try {
    if (typeof selectorAbierto !== "undefined" && selectorAbierto) selectorAbierto.cerrar();
    const existentes = [...listaProductos.querySelectorAll(".producto")];
    existentes.slice(1).forEach(producto => producto.remove());
    for (let i = 1; i < filas.length; i++) agregarProducto();
    [...listaProductos.querySelectorAll(".producto")].forEach((producto, i) => {
      const select = producto.querySelector(".empaque");
      const input = producto.querySelector(".cantidad");
      input.value = filas[i].cantidad;
      input.dataset.ultimaCantidadValida = filas[i].cantidad;
      select.value = filas[i].producto;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    actualizarNumeracion();
  } finally {
    aplicandoFilas = false;
  }
  calcular();
}

function enfocarPrimerProducto() {
  const primero = listaProductos.querySelector(".producto");
  (primero.querySelector(".picker-search") || primero.querySelector(".empaque")).focus();
}

nuevaCotizacion.addEventListener("click", () => {
  const actuales = leerFilas();
  // Una segunda limpieza de la pantalla vacía no borra la opción de deshacer.
  const yaVacia = actuales.length === 1 && actuales[0].producto === "" && actuales[0].cantidad === "1" && !modoLicitacion.checked;
  if (!yaVacia) {
    filasAntesDeLimpiar = actuales;
    licitacionAntesDeLimpiar = modoLicitacion.checked;
  }
  modoLicitacion.checked = false;
  aplicarFilas([{ producto: "", cantidad: "1" }]);
  estadoCotizacion.textContent = filasAntesDeLimpiar
    ? "Datos limpiados. Podés deshacer la limpieza antes de editar otra cotización."
    : "La cotización está vacía. Seleccioná un producto para comenzar.";
  enfocarPrimerProducto();
});

deshacerLimpieza.addEventListener("click", () => {
  if (!filasAntesDeLimpiar) return;
  const filas = filasAntesDeLimpiar;
  filasAntesDeLimpiar = null;
  modoLicitacion.checked = licitacionAntesDeLimpiar;
  aplicarFilas(filas);
  estadoCotizacion.textContent = "Limpieza deshecha. Recuperaste los productos, las cantidades y el modo de cotización anteriores.";
  enfocarPrimerProducto();
});

function construirCotizacion() {
  const filas = filasConImporte();
  const importe = document.getElementById("totalMonto").textContent.trim();
  const traslado = document.getElementById("envioMonto").textContent.trim();
  return [
    "De Marco · Cotización de envío por Berro",
    ...(modoLicitacion.checked ? ["Licitación · Sin cargo de traslado a agencia."] : []),
    "",
    ...filas.map(fila => `• ${nombreProducto(fila.producto)} × ${parseInt(fila.cantidad, 10)}${preciosEmpaques[fila.producto]?.unidadesPorPaquete ? ` unidades — ${detalleEmpaque(fila.producto, fila.cantidad)}` : ""}`),
    "",
    `Total del envío: ${importe}.`,
    "IVA e impuestos según producto, incluidos cuando corresponde.",
    modoLicitacion.checked || traslado === "-" ? "Sin traslado adicional a agencia." : `Traslado a agencia incluido en el total: ${traslado}.`,
  ].join("\n");
}

copiarTotal.addEventListener("click", async () => {
  if (copiarTotal.disabled) return;
  const texto = construirCotizacion();
  try {
    await navigator.clipboard.writeText(texto);
    estadoCotizacion.textContent = "Cotización completa copiada. Ya podés pegarla en WhatsApp o en el presupuesto.";
  } catch {
    textoCotizacion.value = texto;
    copiaManual.hidden = false;
    estadoCotizacion.textContent = "Seleccioná y copiá el texto de abajo para compartir la cotización.";
    textoCotizacion.focus();
    textoCotizacion.select();
  }
});

function invalidarDeshacer() {
  if (!cotizacionLista || aplicandoFilas) return;
  filasAntesDeLimpiar = null;
  deshacerLimpieza.hidden = true;
  guardarCotizacion();
}

modoLicitacion.addEventListener("change", () => {
  invalidarDeshacer();
  calcular();
});

function registrarEdicion(evento) {
  // Buscar en la lista no modifica ni descarta la cotización anterior.
  if (!evento.target.matches(".cantidad") && !evento.target.matches(".empaque")) return;
  invalidarDeshacer();
}
listaProductos.addEventListener("input", registrarEdicion);
listaProductos.addEventListener("change", registrarEdicion);

document.querySelector(".add-product").addEventListener("click", invalidarDeshacer);

function ajustarCantidad(input, paso) {
  const actual = parseInt(input.value, 10) || 0;
  input.value = String(Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, actual + paso)));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

listaProductos.addEventListener("click", evento => {
  const flecha = evento.target.closest(".quantity-step");
  if (flecha) {
    const input = flecha.closest(".quantity-control").querySelector(".cantidad");
    ajustarCantidad(input, Number(flecha.dataset.step));
  }
  if (evento.target.closest(".eliminar")) invalidarDeshacer();
});
listaProductos.addEventListener("keydown", evento => {
  if (!evento.target.matches(".cantidad")) return;
  if (evento.key === "Enter") {
    evento.preventDefault();
    const fila = evento.target.closest(".producto");
    if (!fila.querySelector(".empaque").value) {
      fila.querySelector(".picker-search").focus();
    } else if (!(parseInt(evento.target.value, 10) > 0)) {
      evento.target.focus();
      evento.target.select();
    } else {
      const siguiente = fila.nextElementSibling || agregarProducto();
      invalidarDeshacer();
      siguiente.querySelector(".picker-search").focus();
    }
  }
  if (evento.key === "ArrowUp" || evento.key === "ArrowDown") {
    evento.preventDefault();
    ajustarCantidad(evento.target, evento.key === "ArrowUp" ? 1 : -1);
  }
});

document.addEventListener("cotizacion:actualizada", () => {
  if (!cotizacionLista || aplicandoFilas) return;
  actualizarAcciones();
  guardarCotizacion();
});

window.addEventListener("load", () => {
  let guardada = null;
  let aviso = "";
  try {
    const texto = localStorage.getItem(claveCotizacion);
    if (texto) {
      guardada = JSON.parse(texto);
      if (guardada?.version !== 1 || !validarFilas(guardada.filas)) {
        guardada = null;
        aviso = "No se pudo recuperar el cálculo guardado. Podés comenzar una nueva cotización.";
      }
    }
  } catch {
    aviso = "No se pudo recuperar el cálculo guardado. Podés comenzar una nueva cotización.";
  }
  if (guardada) {
    modoLicitacion.checked = guardada.licitacion === true;
    licitacionAntesDeLimpiar = guardada.deshacerLicitacion === true;
    const haySeleccionesEliminadas = guardada.filas.some(fila => fila.producto && !Object.hasOwn(preciosEmpaques, fila.producto));
    filasAntesDeLimpiar = validarFilas(guardada.deshacer) ? adaptarFilasAlCatalogo(guardada.deshacer) : null;
    aplicarFilas(adaptarFilasAlCatalogo(guardada.filas));
    if (haySeleccionesEliminadas) {
      aviso = "Recuperamos las cantidades. Algunas selecciones ya no están en el catálogo actual: volvé a elegir esos productos.";
    } else if (guardada.catalogo !== firmaCatalogo) {
      aviso = "Cotización recuperada y recalculada con el catálogo actual. Los pórticos se cobran por paquete de hasta 2 unidades en cada línea.";
    }
  }
  cotizacionLista = true;
  calcular();
  if (guardada) estadoCotizacion.textContent = "Recuperamos el último cálculo guardado en este navegador.";
  if (aviso) estadoCotizacion.textContent = aviso;
});
