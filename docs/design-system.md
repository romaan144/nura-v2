# NÜRA 2 — SISTEMA DE DISEÑO

> Identidad visual y reglas de diseño. La fuente de verdad de los **valores**
> (colores, tamaños, tiempos) es el código: `src/index.css` y
> `src/components/ui/index.jsx`. Este documento fija nombres, reglas y criterios —
> no duplica literales. Última actualización: 2026-07-04

**La Regla Permanente de Diseño vive en `manifesto.md` y gobierna todo lo que
sigue:** consistencia → claridad → rapidez de comprensión → facilidad → confianza.
Sistemas, no componentes.

---

## 1. Tokens

**Color** (nombres canónicos; valores en `src/index.css`):
- `--purple` — color de marca (verificado en código: `#7B2FFF`), voz de Nüra y
  acciones primarias. Tintes `--purple-10` / `--purple-20` para fondos y bordes
  suaves de marca.
- `--green-dot` — **el único verde de "activo/disponible" de toda la app**
  (verificado: `#10B981`). Prohibido reintroducir un segundo verde de actividad.
- `--green` — éxito/positivo (confirmaciones, respuesta rápida).
- Tintas: `--ink`, `--ink-secondary`, `--ink-tertiary`, `--ink-disabled`,
  `--ink-border`. Fondo: `--paper`.
- Warning/ámbar: encapsulado en `Badge variant="warning"` — no usar sueltos.

**Tipografía:** escala de sistema en tokens `--text-*` para toda la UI funcional,
más **`--font-voice`** (Fraunces, serif cálida) para La Voz Tipográfica (§3).

**Forma y elevación:** `--radius-md` / `--radius-xl` / `--radius-full`;
`--shadow-sm` / `--shadow-md` / `--shadow-color`.

[PENDIENTE] Formalizar escala de espaciado como tokens (hoy: valores coherentes
por convención).

## 2. Componentes base — `src/components/ui/index.jsx`

**Regla:** ningún patrón de esta lista se reimplementa inline en ninguna
pantalla. Si un patrón visual se repite, se extrae aquí.

- **`Badge`** — pills de estado y confianza. Variantes: `success` (✓ verificado,
  ✓ funcionó), `warning` (🔥 muy solicitado), `purple` (✓ tu conexión, marca),
  `neutral` (atributos). Tamaños `xs / sm / md`.
- **`LiveDot`** — el punto de "activo". Props `size` y `ring`. Decorativo
  (`aria-hidden`). Siempre `--green-dot`.
- **`Bubble`** — testimonios como conversación: avatar de iniciales en color
  rotatorio, burbuja `0 12px 12px 12px`, autor debajo. Texto en `--font-voice`
  itálica.
- **`StatBar`** — números como logros: 1–3 columnas con separadores, valor
  grande + etiqueta pequeña ("4.9★ / valoraciones").

## 3. La Voz Tipográfica (regla de aplicación)

Fraunces aparece **solo donde hablan los humanos o donde Nüra escribe como
humana**: la cita del profesional en su perfil ("En sus propias palabras"), las
reseñas (`Bubble`), la Carta de Presentación Viva y las historias de El Momento
Cero. **Toda la UI funcional** (botones, navegación, datos, formularios)
permanece en tipografía de sistema. Un solo gesto tipográfico = identidad
inconfundible sin ruido.

## 4. Layout y motion (canónico — `engineering.md` remite aquí)

**Layout tipo chat** (Home, registro conversacional): área de mensajes
scrollable + barra `floatBottom` anclada sobre la BottomNav. **Prohibido** meter
contenido de flujo (stats, historias, tarjetas) dentro de `floatBottom`: todo
contenido va en el área scrollable (bug histórico real).

**Animaciones:**
- Keyframes **globales en `src/index.css`** aplicados con `style` inline.
  **Regla iOS (lección real):** las animaciones definidas dentro de CSS Modules
  no funcionan de forma fiable en iOS Safari — siempre keyframe global + inline.
- Entradas: `cardCascade` (tarjetas: resultados, Muro, Escaparate — la
  Revelación Progresiva la reutiliza montando tarjetas escalonadas por estado),
  `fadeInUp`, `popIn`.
- `prefers-reduced-motion: reduce` desactiva globalmente toda animación.
- Probar toda animación nueva en iOS antes de darla por buena.

**Superficie especial:** El Momento Cero es la única pantalla oscura de la app
(fondo nocturno con pulso radial morado) — intencionado, no extender a otras.

## 5. Lenguaje e identidad verbal
*(traducción operativa de la esencia de marca de `manifesto.md`)*

- **Español**, tuteo, tono cálido y directo.
- **Categorías en primera persona de necesidad** ("Cuidar a alguien querido",
  "Arreglar algo en casa") — nunca taxonomía de directorio. Los `id` de
  categoría son contrato estable (ver `changelog.md`); solo cambia el lenguaje.
- **Nüra habla en primera persona, con convicción y humildad:** "Lo he entendido
  así", "es mi recomendación", "dime qué he entendido mal y lo ajusto".
- **Prueba social específica y local:** barrios reales de Barcelona, tiempos
  reales, velocidad real ("⚡ 38s") — nunca genérica.
- **Confianza siempre en verde success con ✓:** "✓ Identidad verificada",
  "✓ Conexión verificada", "✓ funcionó".

## 6. Accesibilidad (base establecida)

- Todo control de solo-icono lleva `aria-label` (volver, enviar, dictar,
  adjuntar, compartir, seguir, borrar persona…). Inputs con etiqueta.
- BottomNav: `nav` etiquetada + `aria-current="page"` en la pestaña activa.
- `lang="es"`; foco visible con anillo morado (`:focus-visible`) — conservar.
- Decorativos con `aria-hidden` (LiveDot, desde el componente).
- `prefers-reduced-motion` respetado globalmente.
- [PENDIENTE] Touch targets mínimos 44px en botones circulares de cabecera.
