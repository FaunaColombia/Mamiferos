/* ==========================================================================
   fotos-config.js
   ==========================================================================
   AQUÍ es donde agregas las fotografías de cada especie.
   Este es el ÚNICO archivo que necesitas tocar para poner o cambiar fotos.

   Hay DOS formas de poner una foto para una especie. Puedes usar la que
   prefieras, o combinarlas (una especie con enlace externo, otra con
   archivo local):

   -----------------------------------------------------------------------
   OPCIÓN 1 — Enlace externo (una URL de internet)
   -----------------------------------------------------------------------
   Agrega una línea en el objeto FOTOS de abajo así:

       "passalites-murelia": "https://ejemplo.com/fotos/venado.jpg",

   La clave ("passalites-murelia") es el "slug" (identificador) de la
   especie. Lo encuentras en data/especies.json, en el campo "slug" de
   cada especie (es el nombre científico en minúsculas, con guiones en
   vez de espacios).

   -----------------------------------------------------------------------
   OPCIÓN 2 — Subir el archivo directamente al repositorio
   -----------------------------------------------------------------------
   1. Guarda tu foto dentro de la carpeta "images/" del proyecto.
   2. Nombra el archivo exactamente igual al "slug" de la especie, por
      ejemplo:  images/passalites-murelia.jpg
      (formatos aceptados: .jpg, .jpeg, .png, .webp)
   3. ¡Listo! No necesitas escribir nada en este archivo: app.js primero
      busca automáticamente "images/<slug>.jpg" (y las otras extensiones)
      antes de recurrir a la lista de abajo. Si el archivo existe, se usa;
      si no existe, se prueba con la siguiente opción.

   -----------------------------------------------------------------------
   ORDEN EN QUE SE BUSCA UNA FOTO (ver la función obtenerFoto en app.js)
   -----------------------------------------------------------------------
   1. images/<slug>.jpg / .jpeg / .png / .webp   (archivo subido directamente)
   2. Una entrada en el objeto FOTOS de aquí abajo (enlace externo)
   3. Si ninguna existe, la tarjeta y la ficha muestran un espacio vacío
      con el mensaje "Sin fotografía disponible".

   Puedes borrar todos los ejemplos de aquí abajo — están comentados y no
   afectan el sitio hasta que quites el "//" y pongas tus propios datos.
   ========================================================================== */

const FOTOS = {
  "dasypus-fenestratus": "https://inaturalist-open-data.s3.amazonaws.com/photos/69900176/medium.jpg",
  "puma-concolor": "https://inaturalist-open-data.s3.amazonaws.com/photos/9834553/original.jpg",
};

/* También puedes poner aquí el crédito/autor de cada foto (opcional).
   Se muestra como un texto pequeño debajo de la imagen en la ficha. */
///const CREDITOS_FOTOS = {
  //"puma-concolor": "Foto: (c) pfaucher – algunos derechos reservados (CC BY-NC)",
  //"dasypus-fenestratus": "Foto: (c) johnmeikle – algunos derechos reservados (CC BY-NC)",
//};

const CREDITOS_FOTOS = {
  "puma-concolor": 'Foto: (c) pfaucher – <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC</a> - <a href="https://www.inaturalist.org/taxa/1647420-Dasypus-fenestratus" target="_blank" rel="noopener noreferrer">Fuente</a>',
  "dasypus-fenestratus": 'Foto: (c) johnmeikle – algunos derechos reservados (<a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC</a>)',
};


///* Crédito, licencia y fuente de cada fotografía */
//const CREDITOS_FOTOS = {
 // "puma-concolor": {
   // autor: "pfaucher",
   // licencia: "CC BY-NC",
   // urlLicencia: "https://creativecommons.org/licenses/by-nc/4.0/",
   // urlFuente: "https://www.inaturalist.org/observations/123456789"
  //},

 // "dasypus-fenestratus": {
   // autor: "johnmeikle",
   // licencia: "CC BY-NC",
   // urlLicencia: "https://creativecommons.org/licenses/by-nc/4.0/",
   // urlFuente: "https://www.inaturalist.org/taxa/1647420-Dasypus-fenestratus"
 // }
//};




