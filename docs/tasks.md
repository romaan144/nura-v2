# Trabajo compartido

## Diseño integral · Codex

**Alcance:** presentación de todas las rutas actuales, empezando por Inicio.
**Rama:** `codex/diseno-integral`.
**Entrega y comprobaciones:** `docs/diseno-integral.md`; el commit y la integración reales se comprueban en GitHub.

**Áreas de diseño:** `src/design-system.css`, CSS de páginas y componentes, estructura visual de `Home`, `Explore`, `Chats`, `Profile`, formularios, marca, navegación, tarjetas y `UserAvatar`.

Mientras esta tarea siga sin integrar, Claude no debe editar esos mismos archivos. Tras integrarla, empezar desde el `main` actualizado y preservar sus clases, tokens y estructura al añadir funciones.

## Funcionalidades · Claude

La siguiente funcionalidad la decide Sergio con Claude. Preferir trabajo independiente en datos, servicios y lógica. Si necesita tocar una pantalla activa de Codex, coordinar el archivo antes de editar; una rama distinta por sí sola no evita conflictos.

### Tarea activa · Cambiar la hora de una cita

**Responsable:** Claude. **Rama:** `claude/funny-clarke-e6m64r`. **Base:** `main` en `15be007`.

**Objetivo:** quien pidió una cita (pendiente o confirmada, aún por llegar) puede «Cambiar la hora» desde «Mis servicios»: se abre la agenda del profesional, elige la nueva y, al enviarla, la antigua se cancela (su hora queda libre) y al profesional le llega «quiere cambiar su cita del … al …». Sin conexión no se cambia nada y se dice.

**Archivos previstos:** `src/pages/MyServices.jsx` (botón junto a «Cancelar la cita»), `src/pages/HelperProfile.jsx` (hoja de pedir cita: título, aviso de la cita que se cambia y espera al envío), `src/utils/escrituras.js` (texto de la propuesta de cambio), `docs/changelog.md`. Con las clases y tokens del diseño integral.

Si Codex necesita alguno de estos archivos mientras la tarea siga abierta, coordinar antes; al integrarla se quita este apartado.

### Última tarea integrada · El profesional se entera cuando le cancelan una cita

Integrada el 2026-09-26 (ver `docs/changelog.md`, 2026-10-08). Tocó `src/data/horarios.js`, `src/utils/sinContestar.js` y `src/components/AgendaProfesional.jsx` (aviso con los tokens del diseño integral). No se tocaron la barra, el menú lateral ni el inicio. Esos archivos quedan libres.

**Deuda existente observada:** lint general con variables sin uso, bloques vacíos y advertencias de hooks. Se conserva fuera del alcance visual; el detalle se obtiene ejecutando `npm run lint`. No confundir una compilación correcta con lint completamente limpio.

## Rutina de cada tarea

1. Actualizar información de `origin/main`; comprobar estado local y no sobrescribir cambios ajenos.
2. Anotar responsable, objetivo, rama y archivos previstos antes de tocar archivos compartidos.
3. Hacer un cambio acotado y probarlo.
4. Antes de integrar, comprobar si `main` cambió, incorporar esos cambios y repetir las pruebas afectadas.
5. Registrar qué cambió y cómo se comprobó. Para diseño, publicar después de las pruebas sin pedir aprobación estética a Sergio ni a Claude.
6. La siguiente herramienta lee los cambios al iniciar su turno. Ninguna afirma que ha avisado automáticamente a la otra.
