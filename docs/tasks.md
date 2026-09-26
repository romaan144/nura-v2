# Trabajo compartido

## Diseño integral · Codex

**Alcance:** presentación de todas las rutas actuales, empezando por Inicio.
**Rama:** `codex/diseno-integral`.
**Entrega y comprobaciones:** `docs/diseno-integral.md`; el commit y la integración reales se comprueban en GitHub.

**Áreas de diseño:** `src/design-system.css`, CSS de páginas y componentes, estructura visual de `Home`, `Explore`, `Chats`, `Profile`, formularios, marca, navegación, tarjetas y `UserAvatar`.

Mientras esta tarea siga sin integrar, Claude no debe editar esos mismos archivos. Tras integrarla, empezar desde el `main` actualizado y preservar sus clases, tokens y estructura al añadir funciones.

## Funcionalidades · Claude

La siguiente funcionalidad la decide Sergio con Claude. Preferir trabajo independiente en datos, servicios y lógica. Si necesita tocar una pantalla activa de Codex, coordinar el archivo antes de editar; una rama distinta por sí sola no evita conflictos.

### Tarea activa · «Tu ciudad» en el perfil y búsqueda que la tiene en cuenta

**Responsable:** Claude. **Rama:** `claude/funny-clarke-e6m64r`. **Base:** `main` en `b865636`.

**Objetivo:** quien busca puede elegir «Tu ciudad» en su perfil (elección explícita: no se deduce de lo que busca, por la regla de memoria con consentimiento). Si su búsqueda no nombra ciudad, salen primero los profesionales de su ciudad y los que atienden online, y detrás el resto (no se esconde a nadie). Si la frase nombra una ciudad, manda la frase, como hasta ahora.

**Archivos previstos:** `src/utils/matching.js` (orden por su ciudad), `src/pages/Profile.jsx` (una fila «Tu ciudad» en «Lo tuyo», con `Fila`, `styles.campo` y los botones que ya usa la pantalla), `scripts/test-matching.mjs`, `docs/changelog.md`.

Si Codex necesita alguno de estos archivos mientras la tarea siga abierta, coordinar antes; al integrarla se quita este apartado.

### Última tarea integrada · Un solo aviso cuando cambian la hora de una cita

Integrada el 2026-09-26 (ver `docs/changelog.md`, 2026-10-10). Tocó la función `helpers-write` (v22), una migración, `horarios.js`, `escrituras.js`, `UserContext.jsx`, `HelperProfile.jsx` (solo la llamada) y `AgendaProfesional.jsx` (aviso con los tokens del diseño integral). Esos archivos quedan libres.

**Deuda existente observada:** lint general con variables sin uso, bloques vacíos y advertencias de hooks. Se conserva fuera del alcance visual; el detalle se obtiene ejecutando `npm run lint`. No confundir una compilación correcta con lint completamente limpio.

## Rutina de cada tarea

1. Actualizar información de `origin/main`; comprobar estado local y no sobrescribir cambios ajenos.
2. Anotar responsable, objetivo, rama y archivos previstos antes de tocar archivos compartidos.
3. Hacer un cambio acotado y probarlo.
4. Antes de integrar, comprobar si `main` cambió, incorporar esos cambios y repetir las pruebas afectadas.
5. Registrar qué cambió y cómo se comprobó. Para diseño, publicar después de las pruebas sin pedir aprobación estética a Sergio ni a Claude.
6. La siguiente herramienta lee los cambios al iniciar su turno. Ninguna afirma que ha avisado automáticamente a la otra.
