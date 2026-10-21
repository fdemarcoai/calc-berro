// Acciones de ventas y persistencia local. Las tarifas y la fórmula están en script.js.
const nuevaCotizacion = document.getElementById("nueva-cotizacion");
const deshacerLimpieza = document.getElementById("deshacer-limpieza");
const copiarTotal = document.getElementById("copiar-total");
const estadoCotizacion = document.getElementById("estado-cotizacion");
const estadoGuardado = document.getElementById("estado-guardado");
const copiaManual = document.getElementById("copia-manual");
const textoCotizacion = document.getElementById("texto-cotizacion");
const listaProductos = document.getElementById("productos");
const claveCotizacion = "demarco.berro.cotizacion.v1";
let filasAntesDeLimpiar = null;
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

function dineroCentavos(centavos) {
  return `$ ${(centavos / 100).toFixed(2)}`;
}

function actualizarDesglose() {
  let base = 0;
  let baseConIva = 0;
  let total = envioAgencia;
  filasConImporte().forEach(fila => {
    const precio = preciosEmpaques[fila.producto];
    const cantidad = parseInt(fila.cantidad, 10);
    base += precio * cantidad;
    baseConIva += precio * iva * cantidad;
    // Mantiene el mismo orden de operaciones que la fórmula original.
    total += precio * iva * demarcoImpuesto * cantidad;
  });
  const centavos = importe => Math.round(Number(importe.toFixed(2)) * 100);
  const baseCentavos = centavos(base);
  const conIvaCentavos = centavos(baseConIva);
  const agenciaCentavos = centavos(envioAgencia);
  const totalCentavos = centavos(total);
  // Diferencias de acumulados: los renglones redondeados suman el total mostrado.
  document.getElementById("detalle-base").textContent = dineroCentavos(baseCentavos);
  document.getElementById("detalle-iva").textContent = dineroCentavos(conIvaCentavos - baseCentavos);
  document.getElementById("detalle-recargo").textContent = dineroCentavos(totalCentavos - agenciaCentavos - conIvaCentavos);
  document.getElementById("detalle-agencia").textContent = dineroCentavos(agenciaCentavos);
  document.getElementById("detalle-total").textContent = dineroCentavos(totalCentavos);
  document.getElementById("tasa-iva").textContent = `(${Math.round((iva - 1) * 100)}%)`;
  document.getElementById("tasa-recargo").textContent = `(${Math.round((demarcoImpuesto - 1) * 100)}%)`;
}

function actualizarAcciones() {
  const hayProductos = filasConImporte().length > 0;
  copiarTotal.disabled = !hayProductos;
  deshacerLimpieza.hidden = !filasAntesDeLimpiar;
  copiaManual.hidden = true;
  estadoCotizacion.textContent = hayProductos
    ? "Copiá productos, cantidades y total del envío para el presupuesto."
    : "Seleccioná un producto para copiar la cotización.";
  actualizarDesglose();
  document.getElementById("total-movil").textContent = document.querySelector("#resultado .iva").textContent.trim();
}

function guardarCotizacion() {
  if (!cotizacionLista || aplicandoFilas) return;
  try {
    localStorage.setItem(claveCotizacion, JSON.stringify({
      version: 1,
      filas: leerFilas(),
      deshacer: filasAntesDeLimpiar,
    }));
    estadoGuardado.textContent = "Guardado en este navegador. Podés cerrar y retomar después.";
  } catch {
    estadoGuardado.textContent = "No se pudo guardar en este navegador. El cálculo sigue disponible mientras esta página esté abierta.";
  }
}

function validarFilas(filas) {
  return Array.isArray(filas) && filas.length > 0 && filas.every(fila =>
    fila && typeof fila.producto === "string" &&
    (fila.producto === "" || Object.hasOwn(preciosEmpaques, fila.producto)) &&
    typeof fila.cantidad === "string" && /^[0-9]*$/.test(fila.cantidad),
  );
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
  (primero.querySelector(".picker-trigger") || primero.querySelector(".empaque")).focus();
}

nuevaCotizacion.addEventListener("click", () => {
  const actuales = leerFilas();
  // Una segunda limpieza de la pantalla vacía no borra la opción de deshacer.
  const yaVacia = actuales.length === 1 && actuales[0].producto === "" && actuales[0].cantidad === "1";
  if (!yaVacia) filasAntesDeLimpiar = actuales;
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
  aplicarFilas(filas);
  estadoCotizacion.textContent = "Limpieza deshecha. Recuperaste los productos y las cantidades anteriores.";
  enfocarPrimerProducto();
});

function construirCotizacion() {
  const filas = filasConImporte();
  const importe = document.querySelector("#resultado .iva").textContent.trim();
  return [
    "De Marco · Cotización de envío por Berro",
    "",
    ...filas.map(fila => `• ${fila.producto} × ${parseInt(fila.cantidad, 10)}`),
    "",
    `Total del envío: ${importe} (IVA incluido).`,
    "Incluye el traslado a agencia.",
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
  input.value = String(Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, actual + paso)));
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
    filasAntesDeLimpiar = validarFilas(guardada.deshacer) ? guardada.deshacer : null;
    aplicarFilas(guardada.filas);
  }
  cotizacionLista = true;
  calcular();
  if (guardada) estadoCotizacion.textContent = "Recuperamos el último cálculo guardado en este navegador.";
  if (aviso) estadoCotizacion.textContent = aviso;
});
