// Selector visual con apertura siempre debajo del campo.
let selectorAbierto = null;
let siguienteSelector = 0;

function normalizarBusqueda(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Un dibujo por familia; las variantes conservan su nombre y sus medidas.
function crearIconoProducto(producto) {
  const nombre = normalizarBusqueda(producto);
  let trazos = 'M12 3 21 8v8l-9 5-9-5V8l9-5Z M3 8l9 5 9-5 M12 13v8 M7.5 5.5l9 5';
  if (/armario|guardarropa/.test(nombre)) {
    trazos = 'M4 3h16v17H4V3Z M12 3v17 M9 10v3 M15 10v3 M6 20v2 M18 20v2';
  } else if (/cajonera|fichero/.test(nombre)) {
    trazos = 'M5 3h14v17H5V3Z M5 9h14 M5 15h14 M10 6h4 M10 12h4 M10 18h4 M7 20v2 M17 20v2';
  } else if (/estanter|racks|super util/.test(nombre)) {
    trazos = 'M4 3v19 M20 3v19 M4 5h16 M4 12h16 M4 19h16 M8 8v4 M11 9v3 M15 15h3v4';
  } else if (/escritorio|pupitre/.test(nombre)) {
    trazos = 'M3 7h18v4H3V7Z M5 11v10 M19 11v10 M14 11v7h5 M16 14h1';
  } else if (/tandem/.test(nombre)) {
    trazos = 'M3 5h7v8H3V5Z M14 5h7v8h-7V5Z M2 13v3h20v-3 M6 16v5 M18 16v5';
  } else if (/sillones|sillon/.test(nombre)) {
    trazos = 'M5 11V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5 M3 10h3v5h12v-5h3v9H3v-9Z M6 19v2 M18 19v2';
  } else if (/silla/.test(nombre)) {
    trazos = 'M6 3h12v9H6V3Z M4 12v4h16v-4 M7 16v5 M17 16v5';
  } else if (/escalera/.test(nombre)) {
    trazos = 'M8 3 4 21 M16 3l4 18 M7 7h10 M6 12h12 M5 17h14';
  } else if (/portico/.test(nombre)) {
    trazos = 'M3 21V3h18v18 M3 6h18 M6 6v15 M18 6v15';
  } else if (/pallet/.test(nombre)) {
    trazos = 'M3 5h18v11H3V5Z M9 5v11 M15 5v11 M2 19h20 M4 16v5 M12 16v5 M20 16v5';
  }
  const icono = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icono.setAttribute("viewBox", "0 0 24 24");
  icono.setAttribute("class", "product-type-icon");
  icono.setAttribute("aria-hidden", "true");
  icono.setAttribute("focusable", "false");
  const dibujo = document.createElementNS("http://www.w3.org/2000/svg", "path");
  dibujo.setAttribute("d", trazos);
  icono.appendChild(dibujo);
  return icono;
}

function inicializarSelector(select) {
  if (select.dataset.selectorVisual) return;
  select.dataset.selectorVisual = "true";
  const id = `selector-producto-${++siguienteSelector}`;
  const selector = document.createElement("div");
  selector.className = "product-picker";
  const panel = document.createElement("div");
  panel.className = "picker-panel";
  panel.hidden = true;
  const busqueda = document.createElement("input");
  busqueda.className = "picker-search";
  busqueda.type = "search";
  busqueda.placeholder = "Buscar producto o empaque…";
  busqueda.autocomplete = "off";
  busqueda.spellcheck = false;
  busqueda.id = id;
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
  panel.append(lista, vacio);
  const campo = document.createElement("div");
  campo.className = "picker-input-wrap";
  const iconoSeleccionado = document.createElement("span");
  iconoSeleccionado.className = "picker-selected-icon";
  iconoSeleccionado.setAttribute("aria-hidden", "true");
  iconoSeleccionado.hidden = true;
  campo.append(iconoSeleccionado, busqueda);
  selector.append(campo, panel);
  const nota = document.createElement("p");
  nota.className = "product-note";
  nota.id = `${id}-nota`;
  nota.hidden = true;
  select.closest(".producto").querySelector(".cantidad").setAttribute("aria-describedby", nota.id);
  selector.append(nota);
  select.after(selector);
  // El select conserva los valores y eventos usados por la calculadora.
  select.hidden = true;
  select.tabIndex = -1;
  let opcionesVisibles = [];
  let activo = -1;

  function sincronizar() {
    busqueda.value = nombreProducto(select.value);
    busqueda.title = nombreProducto(select.value);
    selector.classList.toggle("has-selection", Boolean(select.value));
    iconoSeleccionado.replaceChildren(...(select.value ? [crearIconoProducto(select.value)] : []));
    iconoSeleccionado.hidden = !select.value;
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
    const filtro = normalizarBusqueda(panel.hidden ? "" : busqueda.value);
    lista.replaceChildren();
    opcionesVisibles = [];
    [...select.options].forEach((opcion, indice) => {
      if (!opcion.value || (filtro && !normalizarBusqueda(`${opcion.textContent} ${preciosEmpaques[opcion.value]?.medida || ""}`).includes(filtro))) return;
      const item = document.createElement("div");
      item.id = `${id}-opcion-${indice}`;
      item.className = "picker-option";
      item.dataset.value = opcion.value;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(opcion.value === select.value));
      const texto = document.createElement("span");
      texto.className = "picker-option-text";
      const nombre = document.createElement("span");
      nombre.textContent = opcion.textContent;
      texto.appendChild(nombre);
      const medida = preciosEmpaques[opcion.value]?.medida;
      if (medida) {
        const detalle = document.createElement("span");
        detalle.className = "picker-option-detail";
        detalle.textContent = medida;
        texto.appendChild(detalle);
      }
      item.append(crearIconoProducto(opcion.value), texto);
      lista.appendChild(item);
      opcionesVisibles.push(item);
    });
    vacio.hidden = opcionesVisibles.length > 0;
    activar(Math.max(0, opcionesVisibles.findIndex(item => item.dataset.value === select.value)), false);
  }

  function cerrar() {
    panel.hidden = true;
    busqueda.setAttribute("aria-expanded", "false");
    busqueda.removeAttribute("aria-activedescendant");
    if (selectorAbierto?.elemento === selector) selectorAbierto = null;
    sincronizar();
  }

  function abrir() {
    if (!panel.hidden) return;
    if (selectorAbierto) selectorAbierto.cerrar();
    selectorAbierto = { elemento: selector, cerrar };
    renderizar();
    panel.hidden = false;
    busqueda.setAttribute("aria-expanded", "true");
  }

  function elegir(item) {
    if (!item) return;
    select.value = item.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    cerrar();
    const cantidad = select.closest(".producto").querySelector(".cantidad");
    cantidad.focus();
    cantidad.select();
  }

  busqueda.addEventListener("focus", () => {
    abrir();
    busqueda.select();
  });
  busqueda.addEventListener("click", abrir);
  busqueda.addEventListener("input", () => {
    abrir();
    renderizar();
  });
  busqueda.addEventListener("keydown", evento => {
    if (evento.isComposing) return;
    if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(evento.key)) {
      evento.preventDefault();
      if (evento.key !== "Escape" && panel.hidden) abrir();
      if (evento.key === "ArrowDown") activar(activo + 1);
      if (evento.key === "ArrowUp") activar(activo - 1);
      if (evento.key === "Enter") elegir(opcionesVisibles[activo]);
      if (evento.key === "Escape") cerrar();
    }
    if (evento.key === "Tab") cerrar();
  });
  lista.addEventListener("mousedown", evento => evento.preventDefault());
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
