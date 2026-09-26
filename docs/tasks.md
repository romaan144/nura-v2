# Trabajo compartido

## Diseño integral · Codex

**Alcance:** presentación de todas las rutas actuales, empezando por Inicio.
**Rama:** `codex/diseno-integral`.
**Entrega y comprobaciones:** `docs/diseno-integral.md`; el commit y la integración reales se comprueban en GitHub.

**Áreas de diseño:** `src/design-system.css`, CSS de páginas y componentes, estructura visual de `Home`, `Explore`, `Chats`, `Profile`, formularios, marca, navegación, tarjetas y `UserAvatar`.

Mientras esta tarea siga sin integrar, Claude no debe editar esos mismos archivos. Tras integrarla, empezar desde el `main` actualizado y preservar sus clases, tokens y estructura al añadir funciones.

## Funcionalidades · Claude

La siguiente funcionalidad la decide Sergio con Claude. Preferir trabajo independiente en datos, servicios y lógica. Si necesita tocar una pantalla activa de Codex, coordinar el archivo antes de editar; una rama distinta por sí sola no evita conflictos.

### Tarea activa · Elegir otra hora cuando cancelan una cita

**Responsable:** Claude. **Rama:** `claude/funny-clarke-e6m64r`. **Base:** `main` en `df9ae72`.

**Objetivo:** cuando el profesional cancela una cita o contesta que esa hora no le va, quien la pidió tiene en «Mis servicios» un botón «Elegir otra hora» que abre la ficha del profesional con su agenda ya desplegada. Al pedir la nueva hora, la tarjeta antigua indica que ya se ha pedido otra.

**Archivos previstos** (solo lógica y el botón, con clases y tokens del diseño integral): `src/pages/MyServices.jsx`, `src/pages/HelperProfile.jsx` (abrir la agenda al llegar desde ese botón), `src/context/UserContext.jsx` (enlazar la cita nueva con la cancelada), `docs/changelog.md`.

Si Codex necesita alguno de estos archivos mientras la tarea siga abierta, coordinar antes; al integrarla se quita este apartado.

### Última tarea integrada · Aviso al bloquear un día con citas confirmadas

Integrada el 2026-09-26 (ver `docs/changelog.md`, 2026-10-06). Tocó, sin cambiar su presentación: `EditarBloqueos.jsx`, `EditarFicha.jsx` (paso «Ya tienes una cita en lo que bloqueas»), `MyServices.jsx` (texto de cita cancelada por el profesional) y `Responder.jsx` (texto «Cancelaste…»). Esos archivos quedan libres.

**Deuda existente observada:** lint general con variables sin uso, bloques vacíos y advertencias de hooks. Se conserva fuera del alcance visual; el detalle se obtiene ejecutando `npm run lint`. No confundir una compilación correcta con lint completamente limpio.

## Rutina de cada tarea

1. Actualizar información de `origin/main`; comprobar estado local y no sobrescribir cambios ajenos.
2. Anotar responsable, objetivo, rama y archivos previstos antes de tocar archivos compartidos.
3. Hacer un cambio acotado y probarlo.
4. Antes de integrar, comprobar si `main` cambió, incorporar esos cambios y repetir las pruebas afectadas.
5. Registrar qué cambió y cómo se comprobó. Para diseño, publicar después de las pruebas sin pedir aprobación estética a Sergio ni a Claude.
6. La siguiente herramienta lee los cambios al iniciar su turno. Ninguna afirma que ha avisado automáticamente a la otra.
