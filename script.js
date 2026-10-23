function cargarOpciones(select) {
  select.innerHTML = "<option value=''>Seleccionar</option>";

  const nombres = Object.keys(preciosEmpaques).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  for (const nombre of nombres) {
    const option = document.createElement("option");
    option.value = nombre;
    option.textContent = nombreProducto(nombre);
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

  actualizarNumeracion();

  // Calcula una vez al inicio (por si ya hay valores)
  calcular();
};

function agregarProducto() {
  const contenedor = document.getElementById("productos");

  const div = document.createElement("div");
  div.classList.add("producto");

  div.innerHTML = `
    <button type="button" class="eliminar" onclick="eliminarProducto(this)" aria-label="Quitar producto">✕</button>


    <div class="product-fields">
      <div class="product-field"><span>Producto o empaque</span><select class="empaque" aria-label="Producto o empaque"></select></div>
      <div class="quantity-field"><span>Cantidad</span><div class="quantity-control">
                  <button type="button" class="quantity-step" data-step="-1" aria-label="Disminuir cantidad">−</button>
                  <input class="cantidad" type="text" inputmode="numeric" pattern="[0-9]+" value="1" placeholder="Cantidad" aria-label="Cantidad de unidades" />
                  <button type="button" class="quantity-step" data-step="1" aria-label="Aumentar cantidad">+</button>
                </div></div>
    </div>
  `;

  contenedor.appendChild(div);

  // IMPORTANTE: cargar opciones y conectar eventos para el producto nuevo
  const nuevoSelect = div.querySelector(".empaque");
  cargarOpciones(nuevoSelect);
  conectarEventosEnProducto(div);
  actualizarNumeracion();

  // Recalcular al agregar
  calcular();
  return div;
}

function eliminarProducto(boton) {
  const productos = document.querySelectorAll(".producto");
  if (selectorAbierto?.elemento.closest(".producto") === boton.closest(".producto")) selectorAbierto.cerrar();

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
    producto.setAttribute("role", "group");
    producto.setAttribute("aria-label", `Línea de producto ${index + 1}`);
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

function actualizarIndicacionesProductos() {
  document.querySelectorAll(".producto").forEach(fila => {
    const producto = fila.querySelector(".empaque").value;
    const cantidad = fila.querySelector(".cantidad");
    const nota = fila.querySelector(".product-note");
    nota.textContent = detalleEmpaque(producto, cantidad.value);
    fila.querySelector(".quantity-field").querySelector("span").textContent = producto === "Pórtico" ? "Unidades" : "Cantidad";
    nota.hidden = !nota.textContent;
    cantidad.setAttribute("aria-label", producto === "Pórtico" ? "Cantidad de pórticos (unidades)" : "Cantidad de unidades");
  });
}

// Recalcula con las reglas del catálogo y actualiza las indicaciones de empaque.
const calcularVersionOriginal = calcular;
calcular = function calcularConInterfaz() {
  calcularVersionOriginal();
  actualizarIndicacionesProductos();
  document.dispatchEvent(new Event("cotizacion:actualizada"));
};

// Compatibilidad por si quedó alguna llamada vieja
function mostrarSeleccion() {
  calcular();
}
