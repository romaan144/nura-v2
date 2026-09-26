# Trabajo compartido

## Diseño integral · Codex

**Alcance:** presentación de todas las rutas actuales, empezando por Inicio.
**Rama:** `codex/diseno-integral`.
**Entrega y comprobaciones:** `docs/diseno-integral.md`; el commit y la integración reales se comprueban en GitHub.

**Áreas de diseño:** `src/design-system.css`, CSS de páginas y componentes, estructura visual de `Home`, `Explore`, `Chats`, `Profile`, formularios, marca, navegación, tarjetas y `UserAvatar`.

Mientras esta tarea siga sin integrar, Claude no debe editar esos mismos archivos. Tras integrarla, empezar desde el `main` actualizado y preservar sus clases, tokens y estructura al añadir funciones.

## Funcionalidades · Claude

La siguiente funcionalidad la decide Sergio con Claude. Preferir trabajo independiente en datos, servicios y lógica. Si necesita tocar una pantalla activa de Codex, coordinar el archivo antes de editar; una rama distinta por sí sola no evita conflictos.

### Tarea activa · «Te aviso si aparece alguien» en cualquier ciudad

**Responsable:** Claude. **Rama:** `claude/funny-clarke-e6m64r`, desde `main` (668af70).
**Objetivo:** si alguien busca en una ciudad (nombrada o elegida en «Tu ciudad») donde aún no hay profesionales de eso, decírselo claro y ofrecerle el aviso para esa ciudad. El aviso guarda la ciudad y solo avisa de quien trabaja allí u online.
**Archivos previstos:** `supabase/functions/helpers-write/index.ts`, nueva migración `supabase/migrations/20261012000000_alertas_por_ciudad.sql`, `src/utils/alertas.js`, `src/data/ciudades.js`, `src/components/AlertaSheet.jsx` (solo textos, sin cambiar estilos), `src/components/MisAlertas.jsx` (solo el texto de la fila), `src/pages/Home.jsx` (mensajes y datos del aviso, sin tocar la presentación), `scripts/test-avisos.mjs`, `scripts/test-matching.mjs`, documentación.

### Última tarea integrada · «Tu ciudad» en el perfil y búsqueda que la tiene en cuenta

Integrada el 2026-09-26 (ver `docs/changelog.md`, 2026-10-11). Tocó `src/utils/matching.js` y `src/pages/Profile.jsx` (una fila «Tu ciudad» en «Lo tuyo» con `Fila`, `styles.tarjeta`, `styles.campo` y `styles.acciones`; sin cambiar la presentación existente). Esos archivos quedan libres.

**Deuda existente observada:** lint general con variables sin uso, bloques vacíos y advertencias de hooks. Se conserva fuera del alcance visual; el detalle se obtiene ejecutando `npm run lint`. No confundir una compilación correcta con lint completamente limpio.

## Rutina de cada tarea

1. Actualizar información de `origin/main`; comprobar estado local y no sobrescribir cambios ajenos.
2. Anotar responsable, objetivo, rama y archivos previstos antes de tocar archivos compartidos.
3. Hacer un cambio acotado y probarlo.
4. Antes de integrar, comprobar si `main` cambió, incorporar esos cambios y repetir las pruebas afectadas.
5. Registrar qué cambió y cómo se comprobó. Para diseño, publicar después de las pruebas sin pedir aprobación estética a Sergio ni a Claude.
6. La siguiente herramienta lee los cambios al iniciar su turno. Ninguna afirma que ha avisado automáticamente a la otra.
