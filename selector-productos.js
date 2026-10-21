// Selector visual con apertura siempre debajo del campo.
let selectorAbierto = null;
let siguienteSelector = 0;

function crearMiniatura(nombre) {
  const contenedor = document.createElement("span");
  contenedor.className = "product-thumb";
  contenedor.setAttribute("aria-hidden", "true");
  const mostrarIcono = () => {
    contenedor.replaceChildren();
    contenedor.classList.add("product-thumb-placeholder");
    contenedor.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z"/><path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5V14"/></svg>';
  };
  const foto = fotosProductos[nombre];
  if (!foto) {
    mostrarIcono();
    return contenedor;
  }
  contenedor.title = `Foto de referencia: ${foto.modelo}`;
  const imagen = document.createElement("img");
  imagen.alt = "";
  imagen.width = 44;
  imagen.height = 44;
  imagen.loading = "lazy";
  imagen.decoding = "async";
  imagen.addEventListener("error", () => {
    contenedor.title = "Foto no disponible";
    mostrarIcono();
  }, { once: true });
  imagen.src = foto.imagen;
  contenedor.appendChild(imagen);
  return contenedor;
}

function normalizarBusqueda(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function inicializarSelector(select) {
  if (select.dataset.selectorVisual) return;
  select.dataset.selectorVisual = "true";
  const id = `selector-producto-${++siguienteSelector}`;
  const selector = document.createElement("div");
  selector.className = "product-picker";
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "picker-trigger";
  boton.setAttribute("aria-haspopup", "listbox");
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-controls", `${id}-lista`);

  const panel = document.createElement("div");
  panel.className = "picker-panel";
  panel.hidden = true;
  const busqueda = document.createElement("input");
  busqueda.className = "picker-search";
  busqueda.type = "search";
  busqueda.placeholder = "Buscar producto o empaque…";
  busqueda.autocomplete = "off";
  busqueda.setAttribute("role", "combobox");
  busqueda.setAttribute("aria-label", "Buscar producto o empaque");
  busqueda.setAttribute("aria-autocomplete", "list");
  busqueda.setAttribute("aria-expanded", "false");
  busqueda.setAttribute("aria-controls", `${id}-lista`);
  const lista = document.createElement("div");
  lista.id = `${id}-lista`;
  lista.className = "picker-options";
  lista.setAttribute("role", "listbox");
  lista.setAttribute("aria-label", "Productos y empaques");
  const vacio = document.createElement("p");
  vacio.className = "picker-empty";
  vacio.textContent = "No hay coincidencias. Probá con otro nombre.";
  vacio.setAttribute("role", "status");
  vacio.hidden = true;
  panel.append(busqueda, lista, vacio);
  selector.append(boton, panel);
  select.after(selector);
  // El select conserva los valores y eventos usados por la calculadora.
  select.hidden = true;
  select.tabIndex = -1;
  let opcionesVisibles = [];
  let activo = -1;

  function sincronizar() {
    boton.replaceChildren(crearMiniatura(select.value));
    const texto = document.createElement("span");
    texto.className = "picker-name";
    texto.textContent = select.value || "Seleccionar producto o empaque";
    const flecha = document.createElement("span");
    flecha.className = "picker-chevron";
    flecha.textContent = "⌄";
    flecha.setAttribute("aria-hidden", "true");
    boton.append(texto, flecha);
    boton.setAttribute("aria-label", `Producto o empaque: ${select.value || "sin seleccionar"}`);
    selector.classList.toggle("has-selection", Boolean(select.value));
  }

  function activar(indice, desplazar = true) {
    activo = opcionesVisibles.length ? Math.max(0, Math.min(indice, opcionesVisibles.length - 1)) : -1;
    opcionesVisibles.forEach((opcion, i) => opcion.classList.toggle("is-active", i === activo));
    if (activo >= 0) {
      busqueda.setAttribute("aria-activedescendant", opcionesVisibles[activo].id);
      if (desplazar) opcionesVisibles[activo].scrollIntoView({ block: "nearest" });
    } else {
      busqueda.removeAttribute("aria-activedescendant");
    }
  }

  function renderizar() {
    const filtro = normalizarBusqueda(busqueda.value);
    lista.replaceChildren();
    opcionesVisibles = [];
    [...select.options].forEach((opcion, indice) => {
      if (filtro && (!opcion.value || !normalizarBusqueda(opcion.textContent).includes(filtro))) return;
      const item = document.createElement("div");
      item.id = `${id}-opcion-${indice}`;
      item.className = "picker-option";
      item.dataset.value = opcion.value;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(opcion.value === select.value));
      item.appendChild(crearMiniatura(opcion.value));
      const texto = document.createElement("span");
      texto.className = "picker-option-text";
      const nombre = document.createElement("span");
      nombre.textContent = opcion.value || "Sin producto seleccionado";
      const detalle = document.createElement("small");
      detalle.textContent = opcion.value ? (fotosProductos[opcion.value] ? "Foto de referencia" : "Sin foto identificada") : "Limpiar esta selección";
      texto.append(nombre, detalle);
      item.appendChild(texto);
      lista.appendChild(item);
      opcionesVisibles.push(item);
    });
    vacio.hidden = opcionesVisibles.length > 0;
    activar(Math.max(0, opcionesVisibles.findIndex(item => item.dataset.value === select.value)), false);
  }

  function cerrar(enfocar = false) {
    panel.hidden = true;
    boton.setAttribute("aria-expanded", "false");
    busqueda.setAttribute("aria-expanded", "false");
    busqueda.removeAttribute("aria-activedescendant");
    if (selectorAbierto?.elemento === selector) selectorAbierto = null;
    if (enfocar) boton.focus();
  }

  function abrir() {
    if (selectorAbierto) selectorAbierto.cerrar();
    selectorAbierto = { elemento: selector, cerrar };
    busqueda.value = "";
    renderizar();
    panel.hidden = false;
    boton.setAttribute("aria-expanded", "true");
    busqueda.setAttribute("aria-expanded", "true");
    busqueda.focus({ preventScroll: true });
    // El panel ocupa espacio debajo del campo: no se superpone ni invierte su apertura.
    panel.scrollIntoView({ block: "nearest" });
    activar(activo);
  }

  function elegir(item) {
    if (!item) return;
    select.value = item.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    cerrar(true);
  }

  boton.addEventListener("click", () => panel.hidden ? abrir() : cerrar());
  boton.addEventListener("keydown", evento => {
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      abrir();
    }
  });
  busqueda.addEventListener("input", renderizar);
  busqueda.addEventListener("keydown", evento => {
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", "Escape"].includes(evento.key)) {
      evento.preventDefault();
      if (evento.key === "ArrowDown") activar(activo + 1);
      if (evento.key === "ArrowUp") activar(activo - 1);
      if (evento.key === "Home") activar(0);
      if (evento.key === "End") activar(opcionesVisibles.length - 1);
      if (evento.key === "Enter") elegir(opcionesVisibles[activo]);
      if (evento.key === "Escape") cerrar(true);
    }
    if (evento.key === "Tab") cerrar();
  });
  lista.addEventListener("click", evento => {
    elegir(evento.target.closest('[role="option"]'));
  });
  select.addEventListener("change", () => {
    sincronizar();
    cerrar();
  });
  sincronizar();
}

// Un solo conjunto de escuchas para todas las filas, incluidas las que se agreguen.
function cerrarSelectorAlSalir(evento) {
  if (selectorAbierto && !selectorAbierto.elemento.contains(evento.target)) selectorAbierto.cerrar();
}
document.addEventListener("click", cerrarSelectorAlSalir);
document.addEventListener("focusin", cerrarSelectorAlSalir);
