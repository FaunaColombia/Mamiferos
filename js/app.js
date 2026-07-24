/* ==========================================================================
   app.js
   ==========================================================================
   Lógica principal del catálogo "Mamíferos de Colombia".
   Este archivo NO necesita ningún servidor ni compilación: es JavaScript
   plano que corre directo en el navegador cuando abres index.html (o
   cuando GitHub Pages lo publica).

   ÍNDICE DE FUNCIONES (para ubicarte rápido con Ctrl+F):
     1. ESTADO GLOBAL Y CARGA DE DATOS
        - iniciar()
        - cargarEspecies()
     2. FILTROS
        - poblarSelectsDeFiltros()
        - leerFiltrosActuales()
        - especiesFiltradas()
        - aplicarFiltros()
        - limpiarFiltros()
     3. CUADRÍCULA DE TARJETAS
        - renderizarCuadricula()
        - crearTarjetaEspecie()
        - cargarSiguienteLote()
     4. FOTOGRAFÍAS
        - obtenerFotos()
        - obtenerFoto()
        - probarImagenLocal()
     5. FICHA DE ESPECIE (modal)
        - abrirFicha()
        - cerrarFicha()
        - cambiarPestana()
        - abrirLightbox()
        - cerrarLightbox()
     6. MAPA GENERAL DE LA PORTADA
        - alternarPanelMapa()
        - manejarClicDepartamento()

   CÓMO CAMBIAR CUÁNTAS TARJETAS SE MUESTRAN POR LOTE:
   busca la constante ESPECIES_POR_LOTE aquí abajo.

   CÓMO AGREGAR VARIAS FOTOS A UNA ESPECIE:
   ver js/fotos-config.js. También puedes poner fotos locales numeradas
   en la carpeta images/ (slug.jpg, slug-2.jpg, slug-3.jpg...).
   ========================================================================== */

const ESPECIES_POR_LOTE = 60;

// --------------------------------------------------------------------------
// 1. ESTADO GLOBAL Y CARGA DE DATOS
// --------------------------------------------------------------------------

const estado = {
  todas: [],              // todas las especies del JSON, sin filtrar
  filtradas: [],          // resultado actual de aplicar los filtros
  cantidadMostrada: 0,    // cuántas tarjetas de "filtradas" ya se pintaron
  departamentoSeleccionado: null, // depto elegido en el mapa general (o null)
  mapaGeneral: null,      // referencia al mapa Leaflet de la portada
  mapaFichaActual: null,  // referencia al mapa Leaflet dentro de la ficha abierta
  lightbox: {
    slug: null,           // especie cuyas fotos se están viendo en el lightbox
    fotos: [],            // arreglo de fotos { url, credito } de esa especie
    indice: 0,            // foto actualmente mostrada
  },
};

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  try {
    estado.todas = await cargarEspecies();
  } catch (error) {
    console.error(error);
    document.getElementById('rejilla-especies').innerHTML =
      '<p class="sin-resultados">No se pudo cargar data/especies.json. Verifica que el archivo exista y que estés viendo esta página a través de un servidor (no abriendo el .html directo con doble clic — ver README.md, sección "Probar el sitio en tu computador").</p>';
    return;
  }

  poblarSelectsDeFiltros();
  actualizarEstadisticasCabecera();
  aplicarFiltros();

  // Conecta todos los controles de filtro para que reaccionen al escribir/elegir.
  document.getElementById('campo-busqueda').addEventListener('input', aplicarFiltros);
  // Orden y Familia son "en cascada": al cambiar uno, se recalculan las
  // opciones de los selects que dependen de él (ver actualizarOpcionesFamiliaGenero).
  document.getElementById('filtro-orden').addEventListener('change', () => {
    document.getElementById('filtro-familia').value = '';
    document.getElementById('filtro-genero').value = '';
    actualizarOpcionesFamiliaGenero();
    aplicarFiltros();
  });
  document.getElementById('filtro-familia').addEventListener('change', () => {
    document.getElementById('filtro-genero').value = '';
    actualizarOpcionesFamiliaGenero();
    aplicarFiltros();
  });
  document.getElementById('filtro-genero').addEventListener('change', aplicarFiltros);
  document.getElementById('filtro-amenaza').addEventListener('change', aplicarFiltros);
  document.getElementById('filtro-endemica').addEventListener('change', aplicarFiltros);
  document.getElementById('filtro-cites').addEventListener('change', aplicarFiltros);
  document.getElementById('boton-limpiar').addEventListener('click', limpiarFiltros);
  document.getElementById('boton-toggle-mapa').addEventListener('click', alternarPanelMapa);
  document.getElementById('boton-cargar-mas').addEventListener('click', cargarSiguienteLote);
  document.getElementById('ficha-cerrar').addEventListener('click', cerrarFicha);
  document.getElementById('modal-fondo').addEventListener('click', (evento) => {
    if (evento.target.id === 'modal-fondo') cerrarFicha();
  });
  document.addEventListener('keydown', (evento) => {
    const lightboxAbierto = document.getElementById('modal-lightbox')?.classList.contains('visible');
    if (lightboxAbierto && evento.key === 'ArrowRight') return fotoSiguiente();
    if (lightboxAbierto && evento.key === 'ArrowLeft') return fotoAnterior();
    if (evento.key === 'Escape') {
      cerrarLightbox();
      cerrarFicha();
    }
  });

  // Conecta el botón de cerrar del lightbox y el clic fuera de la imagen.
  const lightbox = document.getElementById('modal-lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', (evento) => {
      if (evento.target.id === 'modal-lightbox') cerrarLightbox();
    });
  }
}

/** Descarga y devuelve el arreglo de especies desde data/especies.json. */
async function cargarEspecies() {
  const respuesta = await fetch('data/especies.json');
  if (!respuesta.ok) throw new Error('No se pudo cargar data/especies.json');
  return respuesta.json();
}

function actualizarEstadisticasCabecera() {
  const total = estado.todas.length;
  const ordenes = new Set(estado.todas.map((e) => e.orden)).size;
  const endemicas = estado.todas.filter((e) => e.endemica).length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-ordenes').textContent = ordenes;
  document.getElementById('stat-endemicas').textContent = endemicas;
}

// --------------------------------------------------------------------------
// 2. FILTROS
// --------------------------------------------------------------------------

/** Llena los <select> de Orden y CITES con los valores que existen en los datos. */
function poblarSelectsDeFiltros() {
  const selectOrden = document.getElementById('filtro-orden');
  const ordenes = [...new Set(estado.todas.map((e) => e.orden))].sort();
  for (const orden of ordenes) {
    const opcion = document.createElement('option');
    opcion.value = orden;
    opcion.textContent = orden;
    selectOrden.appendChild(opcion);
  }

  const selectCites = document.getElementById('filtro-cites');
  const apendices = [...new Set(estado.todas.map((e) => e.cites).filter(Boolean))].sort();
  for (const apendice of apendices) {
    const opcion = document.createElement('option');
    opcion.value = apendice;
    opcion.textContent = `Apéndice ${apendice}`;
    selectCites.appendChild(opcion);
  }

  // Familia y Género se llenan aparte porque son "en cascada": sus opciones
  // dependen de lo que ya esté elegido en Orden (y, para Género, en Familia).
  actualizarOpcionesFamiliaGenero();
}

/**
 * Repuebla los <select> de Familia y Género según el Orden y la Familia
 * elegidos en ese momento, para que el usuario solo vea combinaciones que
 * realmente existen (por ejemplo, si elige el orden "Primates", el select
 * de Familia solo mostrará familias de primates, no las 51 en total).
 * Se llama al iniciar la página y cada vez que cambian Orden o Familia.
 */
function actualizarOpcionesFamiliaGenero() {
  const ordenElegido = document.getElementById('filtro-orden').value;
  const familiaElegidaAntes = document.getElementById('filtro-familia').value;

  // --- Select de Familia: depende solo del Orden elegido ---
  const especiesDelOrden = ordenElegido
    ? estado.todas.filter((e) => e.orden === ordenElegido)
    : estado.todas;

  const selectFamilia = document.getElementById('filtro-familia');
  selectFamilia.innerHTML = '<option value="">Todas las familias</option>';
  const familias = [...new Set(especiesDelOrden.map((e) => e.familia))].sort();
  for (const familia of familias) {
    const opcion = document.createElement('option');
    opcion.value = familia;
    opcion.textContent = familia;
    selectFamilia.appendChild(opcion);
  }
  // Si la familia que estaba elegida sigue siendo válida para el nuevo
  // orden, la dejamos seleccionada (evita perder el filtro al recargar opciones).
  if (familias.includes(familiaElegidaAntes)) selectFamilia.value = familiaElegidaAntes;

  // --- Select de Género: depende del Orden y de la Familia ya filtrados ---
  const familiaElegida = selectFamilia.value;
  const especiesDelGenero = familiaElegida
    ? especiesDelOrden.filter((e) => e.familia === familiaElegida)
    : especiesDelOrden;

  const selectGenero = document.getElementById('filtro-genero');
  const generoElegidoAntes = selectGenero.value;
  selectGenero.innerHTML = '<option value="">Todos los géneros</option>';
  const generos = [...new Set(especiesDelGenero.map((e) => e.genero))].sort();
  for (const genero of generos) {
    const opcion = document.createElement('option');
    opcion.value = genero;
    opcion.textContent = genero;
    selectGenero.appendChild(opcion);
  }
  if (generos.includes(generoElegidoAntes)) selectGenero.value = generoElegidoAntes;
}

/** Lee el valor actual de cada control de filtro del formulario. */
function leerFiltrosActuales() {
  return {
    texto: document.getElementById('campo-busqueda').value.trim().toLowerCase(),
    orden: document.getElementById('filtro-orden').value,
    familia: document.getElementById('filtro-familia').value,
    genero: document.getElementById('filtro-genero').value,
    amenaza: document.getElementById('filtro-amenaza').value,
    endemica: document.getElementById('filtro-endemica').value,
    cites: document.getElementById('filtro-cites').value,
    departamento: estado.departamentoSeleccionado,
  };
}

/**
 * Aplica TODOS los filtros activos (texto, orden, amenaza, endémica, CITES
 * y el departamento elegido en el mapa, si hay alguno) sobre estado.todas
 * y guarda el resultado en estado.filtradas. Esta es la función que se
 * ejecuta cada vez que el usuario cambia cualquier filtro.
 */
function aplicarFiltros() {
  const f = leerFiltrosActuales();

  estado.filtradas = estado.todas.filter((especie) => {
    if (f.texto) {
      const enTexto =
        especie.nombreCientifico.toLowerCase().includes(f.texto) ||
        (especie.nombreComun && especie.nombreComun.toLowerCase().includes(f.texto)) ||
        especie.familia.toLowerCase().includes(f.texto) ||
        especie.genero.toLowerCase().includes(f.texto);
      if (!enTexto) return false;
    }
    if (f.orden && especie.orden !== f.orden) return false;
    if (f.familia && especie.familia !== f.familia) return false;
    if (f.genero && especie.genero !== f.genero) return false;
    if (f.amenaza && especie.estadoAmenaza !== f.amenaza) return false;
    if (f.endemica === 'si' && !especie.endemica) return false;
    if (f.cites && especie.cites !== f.cites) return false;
    if (f.departamento && !especie.departamentosGeo.includes(f.departamento)) return false;
    return true;
  });

  renderizarCuadricula();
  actualizarChipDepartamento();

  // Si el panel del mapa general está abierto, lo repintamos con la nueva
  // selección para que los colores reflejen el filtro activo.
  if (estado.mapaGeneral) {
    actualizarMapaGeneral(estado.mapaGeneral, estado.filtradas);
  }
}

function limpiarFiltros() {
  document.getElementById('campo-busqueda').value = '';
  document.getElementById('filtro-orden').value = '';
  document.getElementById('filtro-familia').value = '';
  document.getElementById('filtro-genero').value = '';
  document.getElementById('filtro-amenaza').value = '';
  document.getElementById('filtro-endemica').value = '';
  document.getElementById('filtro-cites').value = '';
  estado.departamentoSeleccionado = null;
  actualizarOpcionesFamiliaGenero();
  aplicarFiltros();
}

function actualizarChipDepartamento() {
  const contenedor = document.getElementById('chip-departamento');
  contenedor.innerHTML = '';
  if (!estado.departamentoSeleccionado) return;
  const chip = document.createElement('span');
  chip.className = 'chip-filtro-activo';
  chip.innerHTML = `${capitalizarDepartamento(estado.departamentoSeleccionado)} <button type="button" aria-label="Quitar filtro de departamento">&times;</button>`;
  chip.querySelector('button').addEventListener('click', () => {
    estado.departamentoSeleccionado = null;
    aplicarFiltros();
  });
  contenedor.appendChild(chip);
}

// --------------------------------------------------------------------------
// 3. CUADRÍCULA DE TARJETAS
// --------------------------------------------------------------------------

/**
 * Redibuja la cuadrícula desde cero mostrando el primer lote (ESPECIES_POR_LOTE)
 * de estado.filtradas. Se llama cada vez que cambian los filtros.
 */
function renderizarCuadricula() {
  estado.cantidadMostrada = 0;
  const rejilla = document.getElementById('rejilla-especies');
  rejilla.innerHTML = '';

  const resumen = document.getElementById('resumen-resultados');
  resumen.innerHTML = `<strong>${estado.filtradas.length}</strong> especie(s) encontradas de ${estado.todas.length} en total.`;

  if (estado.filtradas.length === 0) {
    rejilla.innerHTML = '<div class="sin-resultados"><h3>Sin resultados</h3><p>Ningún registro coincide con estos filtros. Prueba a quitar alguno.</p></div>';
    document.getElementById('boton-cargar-mas').style.display = 'none';
    return;
  }

  cargarSiguienteLote();
}

/** Agrega a la cuadrícula el siguiente lote de tarjetas (paginación por "cargar más"). */
function cargarSiguienteLote() {
  const rejilla = document.getElementById('rejilla-especies');
  const desde = estado.cantidadMostrada;
  const hasta = Math.min(desde + ESPECIES_POR_LOTE, estado.filtradas.length);

  const fragmento = document.createDocumentFragment();
  for (let i = desde; i < hasta; i++) {
    fragmento.appendChild(crearTarjetaEspecie(estado.filtradas[i]));
  }
  rejilla.appendChild(fragmento);
  estado.cantidadMostrada = hasta;

  const botonMas = document.getElementById('boton-cargar-mas');
  const quedanMas = estado.cantidadMostrada < estado.filtradas.length;
  botonMas.style.display = quedanMas ? 'block' : 'none';
  botonMas.textContent = quedanMas
    ? `Cargar más (${estado.filtradas.length - estado.cantidadMostrada} restantes)`
    : '';
}

/** Construye el elemento <button> de una tarjeta de especie para la cuadrícula. */
function crearTarjetaEspecie(especie) {
  const tarjeta = document.createElement('button');
  tarjeta.type = 'button';
  tarjeta.className = 'tarjeta-especie';
  tarjeta.setAttribute('aria-label', `Ver ficha de ${especie.nombreCientifico}`);

  const zonaFoto = document.createElement('div');
  zonaFoto.className = 'tarjeta-especie__foto';
  zonaFoto.innerHTML = '<span class="tarjeta-especie__foto-vacia">Sin fotografía</span>';
  tarjeta.appendChild(zonaFoto);

  obtenerFoto(especie.slug).then((url) => {
    if (url) zonaFoto.innerHTML = `<img src="${url}" alt="${especie.nombreCientifico}" loading="lazy">`;
  });

  const cuerpo = document.createElement('div');
  cuerpo.className = 'tarjeta-especie__cuerpo';
  cuerpo.innerHTML = `
    <span class="tarjeta-especie__orden">${especie.orden}</span>
    <span class="tarjeta-especie__cientifico">${especie.nombreCientifico}</span>
    ${especie.nombreComun ? `<span class="tarjeta-especie__comun">${especie.nombreComun}</span>` : ''}
    <div class="tarjeta-especie__insignias">
      ${especie.endemica ? '<span class="insignia insignia--endemica">Endémica</span>' : ''}
      ${insigniaAmenaza(especie.estadoAmenaza)}
      ${especie.cites ? `<span class="insignia insignia--cites">CITES ${especie.cites}</span>` : ''}
    </div>
  `;
  tarjeta.appendChild(cuerpo);

  tarjeta.addEventListener('click', () => abrirFicha(especie.slug));
  return tarjeta;
}

function insigniaAmenaza(codigo) {
  if (!codigo) return '';
  const clase = { VU: 'insignia--vu', EN: 'insignia--en', CR: 'insignia--cr' }[codigo] || '';
  const nombres = { VU: 'Vulnerable', EN: 'En peligro', CR: 'En peligro crítico' };
  return `<span class="insignia ${clase}" title="${nombres[codigo] || ''}">${codigo}</span>`;
}

// --------------------------------------------------------------------------
// 4. FOTOGRAFÍAS
// --------------------------------------------------------------------------

// Recordamos el resultado de cada búsqueda de fotos para no repetirla.
const _cacheFotos = new Map();

/**
 * Devuelve (de forma asíncrona) TODAS las fotos disponibles de una especie,
 * como un arreglo de objetos { url, credito }. Combina:
 *   1. Fotos locales numeradas en images/ (slug.jpg, slug-2.jpg, slug-3.jpg...)
 *   2. Fotos externas definidas en js/fotos-config.js (FOTOS y CREDITOS_FOTOS)
 * Si no hay ninguna, devuelve un arreglo vacío. Ver también js/fotos-config.js.
 */
async function obtenerFotos(slug) {
  if (_cacheFotos.has(slug)) return _cacheFotos.get(slug);

  const fotos = [];

  // --- 1. Fotos locales numeradas ---
  let sufijo = '';
  let contador = 1;
  while (true) {
    let encontrada = false;
    for (const extension of ['jpg', 'jpeg', 'png', 'webp']) {
      const ruta = `images/${slug}${sufijo}.${extension}`;
      if (await probarImagenLocal(ruta)) {
        fotos.push({ url: ruta, credito: null });
        encontrada = true;
        break;
      }
    }
    if (!encontrada) break;
    contador++;
    sufijo = `-${contador}`;
  }

  // --- 2. Fotos externas (js/fotos-config.js) ---
  if (typeof FOTOS !== 'undefined' && Array.isArray(FOTOS[slug])) {
    const creditos = typeof CREDITOS_FOTOS !== 'undefined' ? CREDITOS_FOTOS[slug] : [];
    FOTOS[slug].forEach((url, i) => {
      fotos.push({ url, credito: (creditos && creditos[i]) || null });
    });
  }

  _cacheFotos.set(slug, fotos);
  return fotos;
}

/** Devuelve solo la PRIMERA foto disponible — usada por la cuadrícula de tarjetas. */
async function obtenerFoto(slug) {
  const fotos = await obtenerFotos(slug);
  return fotos.length ? fotos[0].url : null;
}

/** Comprueba si una imagen existe intentando cargarla en el navegador. */
function probarImagenLocal(ruta) {
  return new Promise((resolver) => {
    const img = new Image();
    img.onload = () => resolver(true);
    img.onerror = () => resolver(false);
    img.src = ruta;
  });
}

// --------------------------------------------------------------------------
// 5. FICHA DE ESPECIE (modal)
// --------------------------------------------------------------------------

/** Abre el modal de ficha con toda la información de una especie (por su slug). */
async function abrirFicha(slug) {
  const especie = estado.todas.find((e) => e.slug === slug);
  if (!especie) return;

  document.getElementById('ficha-ruta-taxonomica').textContent =
    `${especie.orden} › ${especie.familia} › ${especie.genero}`;
  document.getElementById('ficha-nombre-cientifico').textContent = especie.nombreCientifico;
  document.getElementById('ficha-nombre-comun').textContent = especie.nombreComun || '';

  const zonaFoto = document.getElementById('ficha-foto');
  zonaFoto.innerHTML = '<span class="ficha__foto-vacia">Cargando fotografías…</span>';
  obtenerFotos(slug).then((fotos) => {
    if (fotos.length) {
      zonaFoto.innerHTML = fotos
        .map(
          (foto, i) =>
            `<img src="${foto.url}" alt="${especie.nombreCientifico} - foto ${i + 1}" class="ficha__foto-mosaico" onclick="abrirLightbox('${slug}', ${i})">`
        )
        .join('');
    } else {
      zonaFoto.innerHTML = '<span class="ficha__foto-vacia">Sin fotografía disponible.<br>Ver js/fotos-config.js para agregar una.</span>';
    }
  });

  // --- Pestaña "Información general" ---
  document.getElementById('ficha-tabla-datos').innerHTML = `
    <tr><th>Nombre científico</th><td><em>${especie.nombreCientifico}</em></td></tr>
    <tr><th>Nombre(s) común(es)</th><td>${especie.nombreComun || '—'}</td></tr>
    <tr><th>Orden</th><td>${especie.orden}</td></tr>
    <tr><th>Familia</th><td>${especie.familia}</td></tr>
    <tr><th>Género</th><td>${especie.genero}</td></tr>
    <tr><th>Epíteto específico</th><td>${especie.epiteto}</td></tr>
    <tr><th>Endémica de Colombia</th><td>${especie.endemica ? 'Sí' : 'No'}</td></tr>
    <tr><th>Estado de amenaza (UICN)</th><td>${especie.estadoAmenaza || 'No evaluada / No amenazada'}</td></tr>
    <tr><th>Apéndice CITES</th><td>${especie.cites || '—'}</td></tr>
    <tr><th>Departamentos</th><td>${especie.departamentos.join(', ') || '—'}</td></tr>
    <tr><th>Regiones / zonas de interés</th><td>${especie.ocurrencia || '—'}</td></tr>
  `;

  // --- Pestaña "Descripción" y "Claves de identificación" ---
  // Estos campos vienen vacíos en el Excel original — se completan a mano
  // en data/especies.json (ver docs/GUIA-CONTENIDO.md para instrucciones).
  rellenarTextoLargo('ficha-descripcion', especie.descripcion);
  rellenarTextoLargo('ficha-claves', especie.clavesIdentificacion);

  // --- Pestaña "Distribución" ---
  cambiarPestana('general'); // siempre abre en la primera pestaña
  document.getElementById('modal-fondo').classList.add('visible');
  document.body.style.overflow = 'hidden';

  // El mapa se crea recién cuando el usuario entra a la pestaña de
  // Distribución (ver cambiarPestana) porque Leaflet necesita que su
  // contenedor ya sea visible para medir el tamaño correctamente.
  document.getElementById('modal-fondo').dataset.slugActual = slug;
}

function rellenarTextoLargo(idElemento, texto) {
  const el = document.getElementById(idElemento);
  if (texto && texto.trim()) {
    el.textContent = texto;
    el.classList.remove('vacio');
  } else {
    el.textContent = 'Este contenido aún no se ha redactado para esta especie. Complétalo en el campo correspondiente de data/especies.json (ver docs/GUIA-CONTENIDO.md).';
    el.classList.add('vacio');
  }
}

function cerrarFicha() {
  document.getElementById('modal-fondo').classList.remove('visible');
  document.body.style.overflow = '';
  if (estado.mapaFichaActual) {
    estado.mapaFichaActual.remove();
    estado.mapaFichaActual = null;
  }
}

/** Cambia de pestaña dentro de la ficha ('general' | 'distribucion' | 'descripcion' | 'claves'). */
async function cambiarPestana(nombrePestana) {
  document.querySelectorAll('.ficha__pestana').forEach((boton) => {
    boton.classList.toggle('activa', boton.dataset.pestana === nombrePestana);
  });
  document.querySelectorAll('.ficha__panel').forEach((panel) => {
    panel.classList.toggle('activo', panel.dataset.panel === nombrePestana);
  });

  if (nombrePestana === 'distribucion') {
    const slug = document.getElementById('modal-fondo').dataset.slugActual;
    const especie = estado.todas.find((e) => e.slug === slug);
    if (estado.mapaFichaActual) {
      estado.mapaFichaActual.remove();
      estado.mapaFichaActual = null;
    }
    // Pequeña espera para que el contenedor del mapa ya esté visible y
    // tenga sus dimensiones finales antes de que Leaflet lo mida.
    setTimeout(async () => {
      estado.mapaFichaActual = await crearMapaEspecie('ficha-mapa', especie);
    }, 50);
  }
}

// Conectamos los botones de pestañas (están definidos en index.html con
// data-pestana="...").
document.addEventListener('click', (evento) => {
  const boton = evento.target.closest('.ficha__pestana');
  if (boton) cambiarPestana(boton.dataset.pestana);
});

/** Abre el lightbox (foto en grande) para la foto `indice` de la especie `slug`. */
async function abrirLightbox(slug, indice) {
  const fotos = await obtenerFotos(slug);
  if (!fotos.length) return;
  estado.lightbox.slug = slug;
  estado.lightbox.fotos = fotos;
  estado.lightbox.indice = indice;
  mostrarFotoLightboxActual();
  document.getElementById('modal-lightbox').classList.add('visible');
}

/** Pinta en el lightbox la foto que indica estado.lightbox.indice. */
function mostrarFotoLightboxActual() {
  const { fotos, indice } = estado.lightbox;
  const foto = fotos[indice];
  if (!foto) return;
  document.getElementById('lightbox-img').src = foto.url;
  document.getElementById('lightbox-credito').innerHTML = foto.credito || '';
  document.getElementById('lightbox-contador').textContent =
    fotos.length > 1 ? `${indice + 1} / ${fotos.length}` : '';

  // Oculta las flechas cuando solo hay una foto, o cuando ya no se puede
  // avanzar/retroceder más (no es un carrusel circular).
  document.getElementById('lightbox-anterior').style.visibility = indice > 0 ? 'visible' : 'hidden';
  document.getElementById('lightbox-siguiente').style.visibility = indice < fotos.length - 1 ? 'visible' : 'hidden';
}

/** Muestra la foto siguiente dentro del mismo lightbox, sin cerrarlo. */
function fotoSiguiente() {
  if (estado.lightbox.indice < estado.lightbox.fotos.length - 1) {
    estado.lightbox.indice++;
    mostrarFotoLightboxActual();
  }
}

/** Muestra la foto anterior dentro del mismo lightbox, sin cerrarlo. */
function fotoAnterior() {
  if (estado.lightbox.indice > 0) {
    estado.lightbox.indice--;
    mostrarFotoLightboxActual();
  }
}

function cerrarLightbox() {
  const lightbox = document.getElementById('modal-lightbox');
  if (lightbox) lightbox.classList.remove('visible');
}

// --------------------------------------------------------------------------
// 6. MAPA GENERAL DE LA PORTADA
// --------------------------------------------------------------------------

async function alternarPanelMapa() {
  const panel = document.getElementById('panel-mapa');
  const boton = document.getElementById('boton-toggle-mapa');
  const abrir = !panel.classList.contains('abierto');
  panel.classList.toggle('abierto', abrir);
  boton.classList.toggle('activo', abrir);
  boton.textContent = abrir ? 'Ocultar mapa' : 'Ver mapa de distribución';

  if (abrir && !estado.mapaGeneral) {
    // Igual que con el mapa de la ficha, esperamos un instante a que el
    // contenedor sea visible antes de inicializar Leaflet.
    setTimeout(async () => {
      estado.mapaGeneral = await crearMapaGeneral('mapa-general', estado.filtradas, manejarClicDepartamento);
    }, 60);
  } else if (abrir && estado.mapaGeneral) {
    setTimeout(() => estado.mapaGeneral.invalidateSize(), 60);
  }
}

function manejarClicDepartamento(nombreDepartamento) {
  estado.departamentoSeleccionado =
    estado.departamentoSeleccionado === nombreDepartamento ? null : nombreDepartamento;
  aplicarFiltros();
}
