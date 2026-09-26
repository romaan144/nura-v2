# Trabajo compartido

## Diseño integral · Codex

**Alcance:** presentación de todas las rutas actuales, empezando por Inicio.
**Rama:** `codex/diseno-integral`.
**Entrega y comprobaciones:** `docs/diseno-integral.md`; el commit y la integración reales se comprueban en GitHub.

**Áreas de diseño:** `src/design-system.css`, CSS de páginas y componentes, estructura visual de `Home`, `Explore`, `Chats`, `Profile`, formularios, marca, navegación, tarjetas y `UserAvatar`.

Mientras esta tarea siga sin integrar, Claude no debe editar esos mismos archivos. Tras integrarla, empezar desde el `main` actualizado y preservar sus clases, tokens y estructura al añadir funciones.

## Funcionalidades · Claude

La siguiente funcionalidad la decide Sergio con Claude. Preferir trabajo independiente en datos, servicios y lógica. Si necesita tocar una pantalla activa de Codex, coordinar el archivo antes de editar; una rama distinta por sí sola no evita conflictos.

### Tarea activa · Un solo aviso cuando cambian la hora de una cita

**Responsable:** Claude. **Rama:** `claude/funny-clarke-e6m64r`. **Base:** `main` en `429fc2c`.

**Objetivo:** cuando quien pidió una cita le cambia la hora, el profesional ve un solo aviso en «Mi agenda» («Te han cambiado una cita · Del martes a las 17:00 al sábado a las 16:00», con «Contestar»), no «Te han cancelado una cita» más una propuesta suelta. En la lista, la hora antigua sale como «Cambiada».

**Archivos previstos:**

- Servidor y datos: `supabase/functions/helpers-write/index.ts` (la cancelación anota que es por un cambio; la propuesta nueva guarda de qué hora viene) y una migración nueva en `supabase/migrations/`.
- Lógica: `src/data/horarios.js`, `src/utils/escrituras.js`, `src/context/UserContext.jsx`, `src/pages/HelperProfile.jsx` (solo la llamada al cancelar por cambio).
- Pantalla: `src/components/AgendaProfesional.jsx` (el aviso, con los tokens del diseño integral).
- Pruebas y registro: `scripts/test-matching.mjs`, `scripts/test-avisos.mjs`, `docs/changelog.md`, `docs/current-status.md`.

Si Codex necesita alguno de estos archivos mientras la tarea siga abierta, coordinar antes; al integrarla se quita este apartado.

### Última tarea integrada · Cambiar la hora de una cita

Integrada el 2026-09-26 (ver `docs/changelog.md`, 2026-10-09). Tocó, sin cambiar su presentación: `MyServices.jsx` (botón «Cambiar la hora»), `HelperProfile.jsx` (la hoja de pedir cita espera al envío y dice si es un cambio) y `src/utils/escrituras.js` (texto de la propuesta de cambio). Esos archivos quedan libres.

**Deuda existente observada:** lint general con variables sin uso, bloques vacíos y advertencias de hooks. Se conserva fuera del alcance visual; el detalle se obtiene ejecutando `npm run lint`. No confundir una compilación correcta con lint completamente limpio.

## Rutina de cada tarea

1. Actualizar información de `origin/main`; comprobar estado local y no sobrescribir cambios ajenos.
2. Anotar responsable, objetivo, rama y archivos previstos antes de tocar archivos compartidos.
3. Hacer un cambio acotado y probarlo.
4. Antes de integrar, comprobar si `main` cambió, incorporar esos cambios y repetir las pruebas afectadas.
5. Registrar qué cambió y cómo se comprobó. Para diseño, publicar después de las pruebas sin pedir aprobación estética a Sergio ni a Claude.
6. La siguiente herramienta lee los cambios al iniciar su turno. Ninguna afirma que ha avisado automáticamente a la otra.
