// Reserva siempre espacio visible para Limpiar todo y Deshacer limpieza.
function ajustarPanelCotizacion() {
  const columna = document.querySelector(".summary-column");
  if (!columna) return;
  if (window.matchMedia("(max-width: 700px)").matches) {
    columna.style.removeProperty("--summary-space");
    return;
  }
  const altoVentana = window.visualViewport?.height || window.innerHeight;
  const inicio = Math.max(16, columna.getBoundingClientRect().top);
  columna.style.setProperty("--summary-space", `${Math.max(120, altoVentana - inicio - 16)}px`);
}

let ajustePanelPendiente = false;
function programarAjustePanel() {
  if (ajustePanelPendiente) return;
  ajustePanelPendiente = true;
  window.requestAnimationFrame(() => {
    ajustePanelPendiente = false;
    ajustarPanelCotizacion();
  });
}

window.addEventListener("load", ajustarPanelCotizacion);
window.addEventListener("resize", programarAjustePanel);
window.addEventListener("scroll", programarAjustePanel, { passive: true });
window.visualViewport?.addEventListener("resize", programarAjustePanel);
