// Acciones del equipo de ventas. El cálculo permanece en script.js.
const nuevaCotizacion = document.getElementById("nueva-cotizacion");
const copiarTotal = document.getElementById("copiar-total");
const estadoCotizacion = document.getElementById("estado-cotizacion");
const listaProductos = document.getElementById("productos");

function actualizarAcciones() {
  const hayProductos = [...listaProductos.querySelectorAll(".producto")].some(
    (producto) =>
      producto.querySelector(".empaque").value &&
      parseInt(producto.querySelector(".cantidad").value, 10) > 0,
  );
  copiarTotal.disabled = !hayProductos;
  estadoCotizacion.textContent = hayProductos
    ? "Copiá el importe para incluirlo en el presupuesto de la venta."
    : "Seleccioná un producto para copiar la cotización.";
}

nuevaCotizacion.addEventListener("click", () => {
  const productos = listaProductos.querySelectorAll(".producto");
  productos.forEach((producto, indice) => {
    if (indice > 0) producto.remove();
  });
  eliminarProducto(productos[0].querySelector(".eliminar"));
  actualizarAcciones();
  estadoCotizacion.textContent = "Datos limpiados. Seleccioná un producto para comenzar otra cotización.";
  productos[0].querySelector(".empaque").focus();
});

copiarTotal.addEventListener("click", async () => {
  if (copiarTotal.disabled) return;
  const importe = document.querySelector("#resultado .iva").textContent.trim();
  try {
    await navigator.clipboard.writeText(`Envío por Berro: ${importe} (IVA incluido).`);
    estadoCotizacion.textContent = "Importe copiado. Ya podés pegarlo en el presupuesto.";
  } catch {
    estadoCotizacion.textContent = "No se pudo copiar. Seleccioná el importe y copialo manualmente.";
  }
});

listaProductos.addEventListener("input", actualizarAcciones);
listaProductos.addEventListener("change", actualizarAcciones);

function ajustarCantidad(input, paso) {
  const actual = parseInt(input.value, 10) || 0;
  input.value = String(Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, actual + paso)));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

listaProductos.addEventListener("click", (evento) => {
  const flecha = evento.target.closest(".quantity-step");
  if (flecha) {
    const input = flecha.closest(".quantity-control").querySelector(".cantidad");
    ajustarCantidad(input, Number(flecha.dataset.step));
  }
  if (evento.target.closest(".eliminar")) actualizarAcciones();
});
listaProductos.addEventListener("keydown", (evento) => {
  if (!evento.target.matches(".cantidad")) return;
  if (evento.key === "ArrowUp" || evento.key === "ArrowDown") {
    evento.preventDefault();
    ajustarCantidad(evento.target, evento.key === "ArrowUp" ? 1 : -1);
  }
});
window.addEventListener("load", actualizarAcciones);
