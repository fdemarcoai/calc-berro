let iva = 1.22;
let demarcoImpuesto = 1.25;

const preciosEmpaques = {
  "Armarios 1,20": { precio: 1292, envio: 350, moneda: "$" },
  "Armario 1,90": { precio: 1505, envio: 350, moneda: "$" },
  "Guardarropas 1,80": { precio: 1393, envio: 350, moneda: "$" },
  "Tandem de 2 asientos": { precio: 935, envio: 350, moneda: "$" },
  "Tandem de 3 asientos": { precio: 1531, envio: 350, moneda: "$" },
  "Tandem de 4 asientos": { precio: 2170, envio: 350, moneda: "$" },
  "Fichero 4 cajones": { precio: 1291, envio: 350, moneda: "$" },
  "Estanterías de 2 mts": { precio: 1406, envio: 350, moneda: "$" },
  "Bulto estantería (parantes, estantes)": {
    precio: 354,
    envio: 350,
    moneda: "$",
  },
  "Escalera multiuso": { precio: 354, envio: 350, moneda: "$" },
  "Sillas por 4": { precio: 315, envio: 350, moneda: "$" },
  "Sillas por 5": { precio: 365, envio: 350, moneda: "$" },
  "Silla de oficina": { precio: 446, envio: 350, moneda: "$" },
  Pórtico: { precio: 728, envio: 350, moneda: "$", unidadesPorPaquete: 2 },
  "Racks 1,90 (heavy duty, summit)": { precio: 1738, envio: 350, moneda: "$" },
  "Escritorio chico": { precio: 923, envio: 350, moneda: "$", medida: "Hasta 1,20 m inclusive" },
  "Pupitres armados": { precio: 923, envio: 350, moneda: "$" },
  "Escritorio grande": { precio: 1298, envio: 350, moneda: "$", medida: "Más de 1,20 m" },
  "Armarios metálicos Desarmados": {
    precio: 354,
    envio: 350,
    moneda: "$",
  },
  "Cajonera móvil": { precio: 1005, envio: 350, moneda: "$" },
  "Sillones de 3 cuerpos": { precio: 3096, envio: 350, moneda: "$" },
  "Sillón de 1 cuerpo": { precio: 3096, envio: 350, moneda: "$" },

  Pallet: {
    precio: 3360,
    envio: 350,
    moneda: "$",
  },

  "Súper Útil (3 bultos)": {
    precio: 1500,
    iva: false,
    impuesto: false,
    envio: 0,
    moneda: "$",
  },

  "Armario Xl": {
    precio: 4200,
    iva: false,
    impuesto: false,
    envio: 0,
    moneda: "$",
  },

  "Súper Útil Estante Adicional": {
    precio: 468,
    iva: false,
    impuesto: false,
    envio: 0,
    moneda: "$",
  },

  Airbox: {
    precio: 80,
    iva: false,
    impuesto: false,
    envio: 0,
    moneda: "USD",
  },
};

// Las claves se conservan para recuperar las cotizaciones guardadas.
function nombreProducto(producto) {
  const nombre = preciosEmpaques[producto]?.nombre || producto;
  return nombre.charAt(0).toLocaleUpperCase("es") + nombre.slice(1).toLocaleLowerCase("es");
}

function cantidadFacturable(producto, cantidad) {
  const unidadesPorPaquete = preciosEmpaques[producto]?.unidadesPorPaquete || 1;
  return Math.ceil(Math.max(0, Number(cantidad) || 0) / unidadesPorPaquete);
}

function detalleEmpaque(producto, cantidad) {
  if (!preciosEmpaques[producto]?.unidadesPorPaquete) return "";
  const paquetes = cantidadFacturable(producto, cantidad);
  return `${paquetes} ${paquetes === 1 ? "paquete" : "paquetes"} de hasta 2 unidades. Se cobra por paquete en esta línea.`;
}

function opcionesEmpaquesHTML() {
  const nombres = Object.keys(preciosEmpaques).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );

  let html = "<option value=''>Seleccionar</option>";

  for (const n of nombres) {
    html += `<option value="${escapeHtml(n)}">${escapeHtml(nombreProducto(n))}</option>`;
  }

  return html;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function crearProductoHTML(numero) {
  return `
    <button class="eliminar" type="button" data-accion="eliminar">✕</button>
    <h2>Producto ${numero}</h2>

    <div class="campos">
      <div class="campo">
        <label>Empaque</label>
        <select class="empaque">
          ${opcionesEmpaquesHTML()}
        </select>
      </div>

      <div class="campo">
        <label>Cantidad</label>
        <input class="cantidad" type="number" min="1" value="1" />
      </div>
    </div>
  `;
}

function renumerarProductos() {
  const productos = document.querySelectorAll(".producto");

  productos.forEach((p, i) => {
    const h2 = p.querySelector("h2");
    if (h2) h2.textContent = `Producto ${i + 1}`;
  });
}

function agregarProducto() {
  const contenedor = document.getElementById("productos");
  const numero = contenedor.querySelectorAll(".producto").length + 1;

  const div = document.createElement("div");
  div.className = "producto";
  div.innerHTML = crearProductoHTML(numero);

  contenedor.appendChild(div);
  calcular();
}

function eliminarProducto(productoEl) {
  const contenedor = document.getElementById("productos");
  const productos = contenedor.querySelectorAll(".producto");

  if (productos.length === 1) {
    const select = productos[0].querySelector(".empaque");
    const cantidad = productos[0].querySelector(".cantidad");

    if (select) select.value = "";
    if (cantidad) cantidad.value = 1;

    calcular();
    return;
  }

  productoEl.remove();
  renumerarProductos();
  calcular();
}

function calcularProducto(empaque, cantidad) {
  const config = preciosEmpaques[empaque];
  if (!config) return 0;

  cantidad = cantidadFacturable(empaque, cantidad);
  let precio = config.precio;

  if (config.fijo) {
    return precio * cantidad;
  }

  if (config.iva !== false) {
    precio *= iva;
  }

  if (config.impuesto !== false) {
    precio *= demarcoImpuesto;
  }

  return precio * cantidad;
}

function calcular() {
  const productos = document.querySelectorAll(".producto");

  let totalPesos = 0;
  let totalUSD = 0;
  let hayProductosConEnvio = false;

  for (const producto of productos) {
    const empaque = producto.querySelector(".empaque")?.value || "";
    const cantidad =
      parseInt(producto.querySelector(".cantidad")?.value, 10) || 0;

    if (empaque && cantidad > 0) {
      const config = preciosEmpaques[empaque];
      const precioFinal = calcularProducto(empaque, cantidad);

      if (config?.moneda === "USD") {
        totalUSD += precioFinal;
      } else {
        totalPesos += precioFinal;

        if ((config?.envio || 0) > 0) {
          hayProductosConEnvio = true;
        }
      }
    }
  }

  const esLicitacion = document.getElementById("modo-licitacion")?.checked === true;
  const envio = hayProductosConEnvio && !esLicitacion ? 350 : 0;

  const envioEl = document.getElementById("envioMonto");
  const totalEl = document.getElementById("totalMonto");

  if (envioEl) {
    envioEl.textContent = totalUSD > 0 ? "-" : `$ ${envio.toFixed(2)}`;
  }

  if (totalEl) {
    if (totalUSD > 0) {
      totalEl.textContent = `USD ${totalUSD.toFixed(2)}`;
    } else {
      totalEl.textContent = `$ ${(totalPesos + envio).toFixed(2)}`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("productos");
  const btnAgregar = document.getElementById("btnAgregar");

  if (!contenedor || !btnAgregar) return;

  contenedor.innerHTML = "";

  const primer = document.createElement("div");
  primer.className = "producto";
  primer.innerHTML = crearProductoHTML(1);
  contenedor.appendChild(primer);

  btnAgregar.addEventListener("click", agregarProducto);

  contenedor.addEventListener("click", (e) => {
    const target = e.target;

    if (target instanceof HTMLElement && target.dataset.accion === "eliminar") {
      const productoEl = target.closest(".producto");
      if (productoEl) eliminarProducto(productoEl);
    }
  });

  contenedor.addEventListener("change", (e) => {
    if (e.target.classList.contains("empaque")) {
      calcular();
    }
  });

  contenedor.addEventListener("input", (e) => {
    if (e.target.classList.contains("cantidad")) {
      calcular();
    }
  });

  calcular();
});
