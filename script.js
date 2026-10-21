function cargarOpciones(select) {
  select.innerHTML = "<option value=''>Seleccionar</option>";

  const nombres = Object.keys(preciosEmpaques).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  for (const nombre of nombres) {
    const option = document.createElement("option");
    option.value = nombre;
    option.textContent = nombre;
    select.appendChild(option);
  }

  if (typeof inicializarSelector === "function") inicializarSelector(select);
}

window.onload = function () {
  // Carga opciones en los selects existentes
  document.querySelectorAll(".empaque").forEach((select) => {
    cargarOpciones(select);
  });

  // Conecta eventos para recalcular automáticamente
  document.querySelectorAll(".producto").forEach((producto) => {
    conectarEventosEnProducto(producto);
  });

  // Calcula una vez al inicio (por si ya hay valores)
  calcular();
};

function agregarProducto() {
  const contenedor = document.getElementById("productos");
  const numeroProductos = document.querySelectorAll(".producto").length + 1;

  const div = document.createElement("div");
  div.classList.add("producto");

  div.innerHTML = `
    <button type="button" class="eliminar" onclick="eliminarProducto(this)" aria-label="Quitar producto">✕</button>

    <h2>Producto ${numeroProductos}</h2>

    <div class="product-fields">
      <div class="product-field"><span>Producto o empaque</span><select class="empaque" aria-label="Producto o empaque"></select></div>
      <div class="quantity-field"><span>Cantidad</span><div class="quantity-control">
                  <input class="cantidad" type="text" inputmode="numeric" pattern="[0-9]+" value="1" placeholder="Cantidad" aria-label="Cantidad de unidades" />
                  <div class="quantity-buttons">
                    <button type="button" class="quantity-step" data-step="1" aria-label="Aumentar cantidad"><span aria-hidden="true">▲</span></button>
                    <button type="button" class="quantity-step" data-step="-1" aria-label="Disminuir cantidad"><span aria-hidden="true">▼</span></button>
                  </div>
                </div></div>
    </div>
  `;

  contenedor.appendChild(div);

  // IMPORTANTE: cargar opciones y conectar eventos para el producto nuevo
  const nuevoSelect = div.querySelector(".empaque");
  cargarOpciones(nuevoSelect);
  conectarEventosEnProducto(div);

  // Recalcular al agregar
  calcular();
}

function eliminarProducto(boton) {
  const productos = document.querySelectorAll(".producto");

  // Si queda un solo producto, no lo borres: reseteá a default
  if (productos.length === 1) {
    const producto = productos[0];

    const select = producto.querySelector(".empaque");
    const inputCantidad = producto.querySelector(".cantidad");

    if (select) {
      select.value = ""; // vuelve a "Seleccionar"
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (inputCantidad) {
      inputCantidad.value = "1";
      inputCantidad.dataset.ultimaCantidadValida = "1";
    }

    calcular();
    return;
  }

  // Si hay más de uno, ahí sí se elimina normal
  const producto = boton.closest(".producto");
  if (producto) {
    producto.remove();
    actualizarNumeracion();
  }
  calcular();
}

function actualizarNumeracion() {
  const productos = document.querySelectorAll(".producto");
  productos.forEach((producto, index) => {
    const titulo = producto.querySelector("h2");
    titulo.textContent = `Producto ${index + 1}`;
  });
}

function conectarEventosEnProducto(producto) {
  const selectEmpaque = producto.querySelector(".empaque");
  const inputCantidad = producto.querySelector(".cantidad");

  if (selectEmpaque) {
    selectEmpaque.addEventListener("change", calcular);
  }

  if (inputCantidad) {
    inputCantidad.dataset.ultimaCantidadValida = inputCantidad.value;
    inputCantidad.addEventListener("input", () => {
      if (/^[0-9]*$/.test(inputCantidad.value)) {
        inputCantidad.dataset.ultimaCantidadValida = inputCantidad.value;
      } else {
        inputCantidad.value = inputCantidad.dataset.ultimaCantidadValida;
      }
      calcular();
    });
  }
}

// Conserva intactas las cuentas de calculo-original.js y notifica a la interfaz.
const calcularVersionOriginal = calcular;
calcular = function calcularConInterfaz() {
  calcularVersionOriginal();
  document.dispatchEvent(new Event("cotizacion:actualizada"));
};

// Compatibilidad por si quedó alguna llamada vieja
function mostrarSeleccion() {
  calcular();
}
