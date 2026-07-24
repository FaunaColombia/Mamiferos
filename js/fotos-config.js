/* ==========================================================================
   fotos-config.js
   ==========================================================================
   AQUÍ es donde agregas las fotografías de cada especie.
   Este es el ÚNICO archivo que necesitas tocar para poner o cambiar fotos.

   Cada especie puede tener VARIAS fotos: por eso cada valor de FOTOS es un
   ARREGLO de URLs (aunque solo tengas una foto, va dentro de corchetes [ ]).
   CREDITOS_FOTOS sigue el mismo orden: el crédito en la posición 0
   corresponde a la foto en la posición 0, el crédito 1 a la foto 1, etc.

   Hay DOS formas de poner fotos para una especie. Puedes usar la que
   prefieras, o combinarlas (una especie con enlaces externos, otra con
   archivos locales, o ambas a la vez):

   -----------------------------------------------------------------------
   OPCIÓN 1 — Enlace externo (una o varias URLs de internet)
   -----------------------------------------------------------------------
   Agrega una línea en el objeto FOTOS de abajo así:

       "passalites-murelia": [
         "https://ejemplo.com/fotos/venado-1.jpg",
         "https://ejemplo.com/fotos/venado-2.jpg",
       ],

   La clave ("passalites-murelia") es el "slug" (identificador) de la
   especie. Lo encuentras en data/especies.json, en el campo "slug" de
   cada especie (es el nombre científico en minúsculas, con guiones en
   vez de espacios).

   -----------------------------------------------------------------------
   OPCIÓN 2 — Subir el archivo directamente al repositorio
   -----------------------------------------------------------------------
   1. Guarda tu foto dentro de la carpeta "images/" del proyecto.
   2. Nombra el archivo exactamente igual al "slug" de la especie. Para
      varias fotos de la misma especie, numéralas así:
        images/passalites-murelia.jpg     (foto 1)
        images/passalites-murelia-2.jpg   (foto 2)
        images/passalites-murelia-3.jpg   (foto 3)
      (formatos aceptados: .jpg, .jpeg, .png, .webp)
   3. ¡Listo! No necesitas escribir nada en este archivo: app.js busca
      automáticamente "images/<slug>.jpg", "images/<slug>-2.jpg", etc.
      hasta que un número no encuentre archivo.

   -----------------------------------------------------------------------
   ORDEN EN QUE SE BUSCAN LAS FOTOS (ver la función obtenerFotos en app.js)
   -----------------------------------------------------------------------
   1. images/<slug>.jpg / .jpeg / .png / .webp, luego -2, -3... (locales)
   2. Las entradas del arreglo FOTOS de aquí abajo (enlaces externos)
   3. Si no hay ninguna, la tarjeta y la ficha muestran un espacio vacío
      con el mensaje "Sin fotografía disponible".

   Todas las fotos encontradas (locales + externas) se muestran juntas en
   la ficha de la especie, como un mosaico de miniaturas.
   ========================================================================== */

const FOTOS = {
  "dasypus-fenestratus": [
    "https://inaturalist-open-data.s3.amazonaws.com/photos/69900176/medium.jpg",
     'https://inaturalist-open-data.s3.amazonaws.com/photos/41464395/medium.jpeg',
     ],
  "puma-concolor": [
    "https://inaturalist-open-data.s3.amazonaws.com/photos/9834553/original.jpg",
  ],
};
const CREDITOS_FOTOS = {
  "puma-concolor": [
    'Foto: (c) pfaucher – <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer" style="color: white;">CC BY-NC</a> - <a href="https://www.inaturalist.org/taxa/1647420-Dasypus-fenestratus" target="_blank" rel="noopener noreferrer" style="color: white;">Fuente</a>',
  ],
  "dasypus-fenestratus": [
    'Foto: (c) johnmeikle – algunos derechos reservados (<a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer" style="color: white;">CC BY-NC</a>)',
  ],
};


