// Consulta de las tarifas base vigentes, sin intervenir en los cálculos.
const abrirTarifas = document.getElementById("abrir-tarifas");
const cerrarTarifas = document.getElementById("cerrar-tarifas");
const dialogoTarifas = document.getElementById("tarifas-productos");
const filasTarifas = document.getElementById("filas-tarifas");

abrirTarifas.addEventListener("click", () => {
  filasTarifas.replaceChildren();
  const productos = Object.keys(preciosEmpaques).sort((a, b) =>
    nombreProducto(a).localeCompare(nombreProducto(b), "es", { sensitivity: "base", numeric: true }),
  );
  for (const producto of productos) {
    const config = preciosEmpaques[producto];
    const fila = document.createElement("tr");
    const nombre = document.createElement("td");
    nombre.textContent = nombreProducto(producto);
    const notas = [];
    if (config.medida) notas.push(config.medida);
    if (config.unidadesPorPaquete > 1) notas.push(`Por paquete de hasta ${config.unidadesPorPaquete} unidades; se redondea por línea`);
    if (notas.length) {
      const detalle = document.createElement("small");
      detalle.textContent = notas.join(" · ");
      nombre.appendChild(detalle);
    }
    const precio = document.createElement("td");
    precio.textContent = `${config.moneda || "$"} ${config.precio.toFixed(2)}`;
    fila.append(nombre, precio);
    filasTarifas.appendChild(fila);
  }
  dialogoTarifas.showModal();
  document.body.classList.add("tarifas-abiertas");
});

cerrarTarifas.addEventListener("click", () => dialogoTarifas.close());
dialogoTarifas.addEventListener("close", () => {
  document.body.classList.remove("tarifas-abiertas");
  abrirTarifas.focus();
});
dialogoTarifas.addEventListener("click", evento => {
  if (evento.target !== dialogoTarifas) return;
  const limites = dialogoTarifas.getBoundingClientRect();
  if (evento.clientX < limites.left || evento.clientX > limites.right ||
      evento.clientY < limites.top || evento.clientY > limites.bottom) {
    dialogoTarifas.close();
  }
});

