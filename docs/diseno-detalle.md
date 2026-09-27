# Diseño de detalle · 27 de septiembre de 2026

Responsable: Codex. Rama: `codex/diseno-detalle`, desde `0884d7f`.
Sergio ha autorizado implementación, integración y publicación tras las pruebas.
La integración y el despliegue se verifican en GitHub/Vercel; este documento describe el cambio.

## Qué cambia

- Se retira «Personas que hacen bien» de Inicio y de la barra lateral, sin reemplazarlo por otro eslogan repetido.
- Inicio incorpora un panel translúcido, titular más definido, fondos lavanda/verde y tres elecciones con iconos. Mantiene los mismos mensajes, etiquetas, manejadores y búsqueda.
- Navegación de escritorio en morado profundo; pestaña activa de móvil con contraste oscuro. Se mantienen tamaños y reservas de las barras fijas.
- Perfiles personal y profesional con portada suave, avatares sobre fondo sólido, secciones más claras y controles diferenciados.
- Catálogo con color propio de cada categoría; tarjetas de profesionales, conversaciones, mensajes, seguidos, servicios y publicaciones con superficies coherentes.
- Acceso, alta profesional, carta de presentación, documentos, estados vacíos, página no encontrada, avisos y valoración comparten el lenguaje visual. El formulario de ficha limita su ancho en escritorio.
- Entradas breves, elevación al pasar el puntero, respuesta al pulsar y foco visible. No hay nuevas animaciones decorativas infinitas. La regla global `prefers-reduced-motion` desactiva las entradas/transiciones.

## Para Claude

Actualizar desde `main` antes de continuar. La tarea de búsqueda por oficio registrada en PR #86 sigue siendo responsabilidad de Claude; esta entrega no implementa ni sustituye ese trabajo.

Los cambios en `Home.jsx` son retirar el eslogan y envolver las etiquetas de elección con iconos decorativos. Los textos de los chips y `handleChip`, `handleSend` y matching se conservan. En `Explore.jsx` solo se añade una variable CSS por categoría. Los demás JSX modificados incorporan clases o superficies de presentación.

Consultar `src/design-system.css` y los bloques «Detalle visual» en los módulos. Utilizar `Button` para conservar gradiente, estados y foco. No retirar las clases al modificar una funcionalidad. El registro compartido permite descubrir cambios al leer GitHub; no implica un aviso automático entre herramientas.

## Comprobaciones

- Compilación de producción correcta.
- Búsquedas: 255/255; avisos: 192/192; vista previa: correcta.
- Smoke: 8 pantallas × 2 escenarios y 120 tarjetas × 2 tamaños, correcto.
- Lint comparado con `0884d7f`: mismos 112 errores y 6 avisos previos, ningún hallazgo adicional; `no-undef`: 0. No se declara limpio el lint general.
- Navegador: móvil de 360 y 390 px; escritorio de 1280 px. Recorridos de Inicio, catálogo, perfiles, chats, servicios, seguidos, publicaciones, carta, acceso, registro, legales, enlaces inválidos y página inexistente. Sin desbordamiento horizontal en los recorridos medidos.
- Búsqueda → recomendación → chat → envío en demo aislada; apertura/cierre de edición de ficha; estado sin profesionales y apertura/cierre de aviso en una copia sin demo. Revisión visual mediante capturas de Inicio, catálogo, perfiles, chat, formulario, acceso y aviso.
- Estas pruebas de interacción usan servidores locales que interceptan peticiones externas. No se enviaron mensajes ni cambios a la base de datos de producción. No prueban entrega real de correos, permisos del móvil ni todos los casos del servidor.

## Decisiones visuales

Morado profundo `#302142`, lavanda `#EAE2F8`, verde `#E1EDE7` y papel `#F7F6FA`. El color sirve para distinguir acciones, identidad y categorías. Los efectos acompañan la interacción sin desplazar botones ni modificar su comportamiento.
