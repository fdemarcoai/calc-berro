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
  estadoCotizacion.textContent = "Nueva cotización lista. Seleccioná el primer producto.";
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
listaProductos.addEventListener("click", (evento) => {
  if (evento.target.closest(".eliminar")) actualizarAcciones();
});
window.addEventListener("load", actualizarAcciones);
