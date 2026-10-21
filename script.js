let contadorProductos = 1;
let iva = 1.22;
let demarcoImpuesto = 1.25;
let envioAgencia = 350;

const preciosEmpaques = {
  "Armarios 1,20": 1123,
  "Armario 1,90": 1309,
  "Guardarropas 1,80": 1211,
  "Tandem de 2 asientos": 813,
  "Tandem de 3 asientos": 1330,
  "Tandem de 4 asientos": 1886,
  "Tandem de 5 asientos": 1984,
  "Tandem de 6 asientos": 2399,
  "Tandem de 8 asientos": 3096,
  "Fichero 4 cajones": 1123,
  "Estanterías de 2 mts": 1222,
  "Bulto estantería (parantes, estantes)": 308,
  "Sillas por 4": 273,
  "Sillas por 5": 316,
  "Silla de oficina": 388,
  Pórtico: 633,
  "Racks 1,90 (heavy duty, summit)": 1510,
  "Escritorio chico": 802,
  "Escritorio grande": 1128,
  "Súper Útil (3 bultos)": 2190,
  "Armarios Petra metálicos XL (sin armar)": 3120,
  "Cajonera móvil": 1005,
  "Sillones de 3 cuerpos": 2693,
  "Sillón de 1 cuerpo": 2693,
  "Mesa con 6 bancos rebatibles": 2900,
  "Mesa recepción 90/120 cm": 3058,
  Pallet: 2922,
};

function cargarOpciones(select) {
  select.innerHTML = "<option value=''>Seleccionar</option>";

  for (let nombre in preciosEmpaques) {
    const option = document.createElement("option");
    option.value = nombre;
    option.textContent = nombre;
    select.appendChild(option);
  }
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
      <label class="product-field">Producto o empaque<select class="empaque"></select></label>
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

    if (select) select.value = ""; // vuelve a "Seleccionar"
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

function calcular() {
  const productos = document.querySelectorAll(".producto");
  // SE LE AGREGUA EL COSTO FIJO
  let total = envioAgencia;

  productos.forEach((producto) => {
    const empaque = producto.querySelector(".empaque")?.value || "";
    const cantidadRaw = producto.querySelector(".cantidad")?.value;
    const cantidad = parseInt(cantidadRaw, 10) || 0;

    if (empaque && cantidad > 0) {
      const precioBase = preciosEmpaques[empaque];
      const precioFinal = precioBase * iva * demarcoImpuesto * cantidad;
      total += precioFinal;
    }
  });

  const resultadoEl = document.getElementById("resultado");
  resultadoEl.innerHTML = `Precio total: <span class="iva">$ ${total.toFixed(2)}</span> IVA inc.`;
}

// Compatibilidad por si quedó alguna llamada vieja
function mostrarSeleccion() {
  calcular();
}
