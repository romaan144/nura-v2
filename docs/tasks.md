# Trabajo compartido

## Diseño integral · Codex

**Alcance:** presentación de todas las rutas actuales, empezando por Inicio.
**Rama:** `codex/diseno-integral`.
**Entrega y comprobaciones:** `docs/diseno-integral.md`; el commit y la integración reales se comprueban en GitHub.

**Áreas de diseño:** `src/design-system.css`, CSS de páginas y componentes, estructura visual de `Home`, `Explore`, `Chats`, `Profile`, formularios, marca, navegación, tarjetas y `UserAvatar`.

Mientras esta tarea siga sin integrar, Claude no debe editar esos mismos archivos. Tras integrarla, empezar desde el `main` actualizado y preservar sus clases, tokens y estructura al añadir funciones.

## Funcionalidades · Claude

La siguiente funcionalidad la decide Sergio con Claude. Preferir trabajo independiente en datos, servicios y lógica. Si necesita tocar una pantalla activa de Codex, coordinar el archivo antes de editar; una rama distinta por sí sola no evita conflictos.

### Tarea activa · Aviso al bloquear un día con citas confirmadas

**Responsable:** Claude. **Rama:** `claude/funny-clarke-e6m64r`. **Base:** `main` en `e5a75c4` (con el diseño integral ya integrado).

**Objetivo:** si un profesional bloquea un día u hora en el que ya tiene una cita confirmada, la app se lo dice antes de guardar («Ese día tienes una cita a las 17:00») y le ofrece cancelarla avisando a esa persona. Quien pidió la cita la ve cancelada por el profesional, con su motivo si lo escribe, y la hora queda libre.

**Archivos previstos:**

- Lógica y datos: `src/data/horarios.js`, `src/utils/escrituras.js`, `src/context/UserContext.jsx`.
- Servidor: `supabase/functions/helpers-write/index.ts` (operación nueva para que el profesional, con su sesión, cancele una cita suya) y una migración nueva en `supabase/migrations/`.
- Pantallas, solo para añadir el aviso y los textos, conservando clases, tokens y estructura del diseño integral: `src/components/EditarBloqueos.jsx`, `src/components/EditarFicha.jsx`, `src/pages/MyServices.jsx`, `src/components/RecordatorioCita.jsx`.
- Pruebas y registro: `scripts/test-matching.mjs`, `scripts/test-avisos.mjs`, `docs/changelog.md`, `docs/current-status.md`.

Si Codex necesita alguna de estas pantallas mientras la tarea siga abierta, coordinar antes; al integrarla se quita este apartado.

**Deuda existente observada:** lint general con variables sin uso, bloques vacíos y advertencias de hooks. Se conserva fuera del alcance visual; el detalle se obtiene ejecutando `npm run lint`. No confundir una compilación correcta con lint completamente limpio.

## Rutina de cada tarea

1. Actualizar información de `origin/main`; comprobar estado local y no sobrescribir cambios ajenos.
2. Anotar responsable, objetivo, rama y archivos previstos antes de tocar archivos compartidos.
3. Hacer un cambio acotado y probarlo.
4. Antes de integrar, comprobar si `main` cambió, incorporar esos cambios y repetir las pruebas afectadas.
5. Registrar qué cambió y cómo se comprobó. Para diseño, publicar después de las pruebas sin pedir aprobación estética a Sergio ni a Claude.
6. La siguiente herramienta lee los cambios al iniciar su turno. Ninguna afirma que ha avisado automáticamente a la otra.
