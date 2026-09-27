# Bienvenida limpia y alternativas juntas

Codex · 2026-09-27 · rama `codex/alternativas-juntas`, desde `32cbf93` (PR #90).

Petición de Sergio: retirar retroceso sin destino y «A tu ritmo», distinguir un poco más el cristal del fondo y reunir todas las alternativas en el siguiente paso al profesional principal.

## Cambios

- ResponseScreen no muestra pie cuando solo hay una página. Cuando hay varias, muestra progreso y siguiente; la flecha atrás existe únicamente desde la segunda página.
- Fondo exterior ligeramente más oscuro y burbuja más clara, con transparencia, desenfoque y borde de cristal conservados.
- Home coloca la primera persona por separado y las alternativas (hasta las tres que ya mostraba) en un bloque indivisible con sección «Otras opciones». Esta sección comienza en otra página incluso si queda espacio en la recomendación principal. El botón indica «Ver otras opciones».
- Las tarjetas de comparación tienen el mismo tamaño. Su grupo se ajusta al espacio disponible: filas en condiciones normales y columnas cuando hay muy poca altura. En ese caso muestra lo esencial y se entra en la ficha para consultar el resto o contactar. Nunca se reparten en varios pasos.
- Conservados ranking, datos, manejadores de búsqueda, contacto y navegación. Claude debe preservar el grupo de alternativas al continuar las funcionalidades.

## Comprobaciones

Build correcto; matching 255/255; 200 casos de paginación; smoke de ocho pantallas × dos escenarios y 120 profesionales × cuatro variantes (se añade comparación). Lint sin diagnósticos nuevos, no-undef cero; sigue la deuda previa.

Navegador: bienvenida sin pie ni flecha; recomendación principal separada; las tres alternativas juntas y del mismo tamaño a 390×844, 320×568, 390×380 y 1280×900. Revisados límites y ausencia de desbordamiento. Acceso por teclado a un perfil alternativo. Pruebas con datos ficticios locales, sin mensajes ni citas reales.

La publicación se comprueba por la integración y el despliegue de GitHub/Vercel, no por este documento.
