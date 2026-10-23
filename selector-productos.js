// Selector visual con apertura siempre debajo del campo.
let selectorAbierto = null;
let siguienteSelector = 0;

function normalizarBusqueda(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
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
  selector.append(busqueda, panel);
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
      if (!opcion.value || (filtro && !normalizarBusqueda(opcion.textContent).includes(filtro))) return;
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
      item.appendChild(texto);
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
