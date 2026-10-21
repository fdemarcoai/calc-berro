// Fotos de referencia tomadas de las fichas y listados de demarco.com.uy.
// Estos datos ilustran categorías de transporte; no definen precios ni impuestos.
const fotosProductos = {
  "Armario 1,90": { imagen: "https://demarco.com.uy/3343-pd4_def/armario-grande-linea-metallo.jpg", fuente: "https://demarco.com.uy/armario-grande-linea-metallo", modelo: "Armario Metallo de 190 cm" },
  "Guardarropas 1,80": { imagen: "https://demarco.com.uy/4189-pd4_def/guardarropas-3-puertas-largas.jpg", fuente: "https://demarco.com.uy/guardarropas-3-puertas-largas", modelo: "Guardarropas de 3 puertas, 180 cm" },
  "Tandem de 2 asientos": { imagen: "https://demarco.com.uy/1034-pd4_def/sillas-en-tandem-linea-fly.jpg", fuente: "https://demarco.com.uy/sillas-en-tandem-linea-fly", modelo: "Tándem Fly de 2 cuerpos" },
  "Tandem de 3 asientos": { imagen: "https://demarco.com.uy/1042-home_default/sillas-en-tandem-linea-fly-3-cuerpos.jpg", fuente: "https://demarco.com.uy/sillas-en-tandem-linea-fly-3-cuerpos", modelo: "Tándem Fly de 3 cuerpos" },
  "Tandem de 4 asientos": { imagen: "https://demarco.com.uy/1071-home_default/sillas-en-tandem-linea-fly-4-cuerpos.jpg", fuente: "https://demarco.com.uy/sillas-en-tandem-linea-fly-4-cuerpos", modelo: "Tándem Fly de 4 cuerpos" },
  "Fichero 4 cajones": { imagen: "https://demarco.com.uy/4002-home_default/fichero-de-4-cajones-linea-petra.jpg", fuente: "https://demarco.com.uy/ficheros", modelo: "Fichero Petra de 4 cajones" },
  "Estanterías de 2 mts": { imagen: "https://demarco.com.uy/2775-pd4_def/estanteria-metalica-reforzada-metallo.jpg", fuente: "https://demarco.com.uy/estanteria-metalica-reforzada-metallo", modelo: "Estantería reforzada Metallo de 200 cm" },
  "Silla de oficina": { imagen: "https://demarco.com.uy/5690-pd4_def/silla-operativa-plus.jpg", fuente: "https://demarco.com.uy/silla-operativa-plus", modelo: "Silla operativa Plus" },
  "Racks 1,90 (heavy duty, summit)": { imagen: "https://demarco.com.uy/4889-pd4_def/heavy-duty.jpg", fuente: "https://demarco.com.uy/heavy-duty", modelo: "Rack Heavy Duty" },
  "Escritorio grande": { imagen: "https://demarco.com.uy/1524-pd4_def/escritorio-operativo-grande-linea-nexus.jpg", fuente: "https://demarco.com.uy/escritorio-operativo-grande-linea-nexus", modelo: "Escritorio Nexus de 150 cm" },
  "Súper Útil (3 bultos)": { imagen: "https://demarco.com.uy/9295-pd4_def/rack-super-util-4-niveles-negro.jpg", fuente: "https://demarco.com.uy/221-rack-super-util-4-niveles-negro.html", modelo: "Rack Super Útil de 4 niveles" },
  "Armarios Petra metálicos XL (sin armar)": { imagen: "https://demarco.com.uy/3262-pd4_def/armario-xl-puertas-batientes-linea-petra.jpg", fuente: "https://demarco.com.uy/armario-xl-puertas-batientes-linea-petra", modelo: "Armario Petra XL, foto del mueble armado" },
  "Cajonera móvil": { imagen: "https://demarco.com.uy/4039-home_default/cajonera-movil-linea-office-gris.jpg", fuente: "https://demarco.com.uy/cajonera-movil-linea-office-gris", modelo: "Cajonera móvil Office" },
  "Sillones de 3 cuerpos": { imagen: "https://demarco.com.uy/6712-home_default/sillon-de-3-cuerpos-linea-kahlo.jpg", fuente: "https://demarco.com.uy/25-sillones", modelo: "Sillón Kahlo de 3 cuerpos" },
  "Sillón de 1 cuerpo": { imagen: "https://demarco.com.uy/7945-home_default/sillon-de-1-cuerpo-linea-onetti.jpg", fuente: "https://demarco.com.uy/25-sillones", modelo: "Sillón Onetti de 1 cuerpo" },
  "Mesa con 6 bancos rebatibles": { imagen: "https://demarco.com.uy/2243-home_default/mesa-con-6-bancos.jpg", fuente: "https://demarco.com.uy/mesas-para-comerdor", modelo: "Mesa con 6 bancos rebatibles" },
  "Mesa recepción 90/120 cm": { imagen: "https://demarco.com.uy/1986-pd4_def/mesa-de-recepcion-office-90.jpg", fuente: "https://demarco.com.uy/mesa-de-recepcion-office-90", modelo: "Mesa de recepción Office de 90 cm" },
};
