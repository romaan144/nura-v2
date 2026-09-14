# Nüra · Plan de rediseño

> **Estado vivo.** Al terminar cada etapa se marca aquí y se actualiza
> `current-status.md`. Si se acaba el contexto, **este documento dice por
> dónde seguir** sin necesidad de releer nada más.

---

## La idea que gobierna todo

Lo aprendido en Home, y que vale para el resto:

**Un sistema coherente no hace que algo sea bonito.** Siete ciclos
unificando curvas, sombras y tipografía dejaron el sistema perfecto — y el
fundador abrió la app y dijo que no le gustaba. Tenía razón.

Lo que sí funcionó en Home fueron tres movimientos, y son los que se repiten
en cada etapa:

1. **Quitar lo que ensucia.** Cada pantalla hace UNA cosa. Lo que no sirve a
   esa cosa, se va a donde le corresponde.
2. **Que lo importante mande.** Si dos elementos compiten, gana el que menos
   importa. Hay que decidir cuál es el protagonista y darle el peso.
3. **Que lo que se toca invite, no se rellene.** Superficies con aire y
   cristal, movimiento con intención, y reacciones que acercan en vez de
   hundir.

**Y el límite:** elegante, no espacial. Nüra existe para que alguien
asustado encuentre ayuda. Si parece una nave, se pierde a esa persona.

---

## El orden, y por qué

No por gusto: **por cuántas personas lo ven y cuánto decide**.

| # | etapa | por qué ahí |
|---|---|---|
| ✅ 0 | **Home** | la puerta. Todo el mundo pasa |
| 1 | **La respuesta de Nüra** | el momento en que el producto cumple su promesa |
| 2 | **La ficha del profesional** ⬅ **SIGUIENTE** | donde se decide confiar en alguien |
| 3 | **El chat** | donde ocurre la conversación real |
| 4 | **Profesionales (Explorar)** | la puerta de quien ya sabe qué busca |
| 5 | **Comunidad** | la prueba de que hay gente viva |
| 6 | **Chats y Mis servicios** | volver a lo empezado |
| 7 | **Perfil y Siguiendo** | lo propio |
| 8 | **Los tres momentos de entrada** | onboarding, alta, `/r/:token` |

---

## Etapa 0 · Home ✅ *(2026-08-16)*

- Retirado el susurro de Comunidad, que cortaba entre saludo y pregunta
- La promesa manda sobre el saludo (26px vs 13px)
- Los chips de respuesta en columna, con cristal y entrada escalonada
- La barra inferior **flota** como isla
- La cápsula **se ilumina** al escribir, no cambia de color

Leyes en `design-system.md`.

---

## Etapa 1 · La respuesta de Nüra ✅ *(2026-08-16)*

- La promesa se retira al llegar la respuesta (26px → 17px, con transición)
- El porqué tiene línea propia y sube a 17px — la frase que justifica Nüra
- La fila de ajuste con cristal y aire; sigue siendo retoque, no decisión

Ley en `design-system.md`.

### Lo que queda anotado para más adelante
La tarjeta de recomendación (`HelperCardTall`) no se tocó en esta etapa: es
la misma que se usa en Explorar y Comunidad, así que su rediseño toca varias
pantallas y merece su propio ciclo. **Candidata natural tras la etapa 2.**

---

## ~~Etapa 1~~ *(detalle original)*

**Qué es.** Lo que aparece tras buscar: la tarjeta del profesional
recomendado, el porqué, las alternativas y la fila de ajuste.

**Por qué ahora.** Es **el momento en que Nüra cumple su promesa**. Si la
recomendación no se siente especial, todo lo anterior da igual.

**Dónde mirar.** `HelperCardTall.jsx`, `HelperCarousel.jsx`, y el bloque de
resultados de `Home.module.css` (`.carouselBlock`, `.refineRow`).

**Preguntas que guían:**
- ¿La tarjeta se siente como *"he encontrado a alguien"* o como un resultado
  de búsqueda?
- El porqué —*"trabaja muy cerca de ti y lleva 8 años con casos como el
  tuyo"*— ¿tiene el peso que merece, o es letra pequeña?
- Las alternativas, ¿acompañan o compiten?
- La fila de ajuste sigue siendo píldoras pequeñas: mismo problema que ya se
  resolvió en los chips de respuesta.

---

## Etapa 2 · La ficha del profesional ⬅ **SIGUIENTE**

**Dónde.** `HelperProfile.jsx` — 489 líneas de CSS, la pantalla más densa.

**Por qué importa.** Es donde alguien decide **confiar en una persona**.
Hoy mezcla identidad, indicadores, bloques de experiencia, opiniones y la
barra de acción. Muchas cosas compitiendo.

**Preguntas:** ¿qué es lo primero que necesita saber quien duda? ¿La
foto y el nombre tienen el peso de una persona, o de una ficha?

---

## Etapa 3 · El chat

**Dónde.** `Chat.jsx`, `Chat.module.css`, `conversation.module.css`.

**Por qué.** Es donde ocurre lo que Nüra promete. Las burbujas, la hoja de
reserva y la barra de acción llevan sin tocarse desde antes del rediseño.

---

## Etapa 4 · Profesionales

**Dónde.** `Explore.jsx` — las tarjetas de categoría ya bajaron a 18px, pero
la pantalla entera es una rejilla de ocho puertas anchas.

**Nota:** enlaza con la conversación sobre Doctoralia. Aquí entra quien ya
sabe qué busca, y hoy tiene que bucear.

---

## Etapa 5 · Comunidad

**Dónde.** `Feed.jsx`, `PostCard.jsx` — 29 superficies, la pantalla con más
elementos repetidos. Cualquier mejora se multiplica por 29.

---

## Etapa 6 · Chats y Mis servicios

Las dos listas de "vuelve a lo que empezaste". `Chats.module.css` tiene 177
líneas y `MyServices` 99: son las más simples, y probablemente las más
sosas.

---

## Etapa 7 · Perfil y Siguiendo

Lo propio: quién eres en Nüra y a quién sigues.

---

## Etapa 8 · Los tres momentos de entrada

Onboarding, alta profesional y `/r/:token`. Son las primeras impresiones —
del usuario y del profesional.

---

## Cómo se trabaja cada etapa

El ciclo de **NÜRA DISEÑO**, una etapa por vez:

1. **Medir** la pantalla en navegador antes de opinar
2. **Proponer** con el problema y el porqué — parar
3. **Implementar** lo aprobado
4. **Verificar**: build, lint, suite, smoke, rutas, accesibilidad AA
5. **Documentar** la ley en `design-system.md`, commit, push

**Reglas fijas:**
- Nunca romper accesibilidad AA — se mide después de cada etapa
- `prefers-reduced-motion` respetado en toda animación
- El comportamiento en navegador manda sobre la teoría
- Si una mejora exige decisión de producto, se para y se pregunta

---

## Si se acaba el contexto

Leer este documento, mirar la etapa marcada como **SIGUIENTE**, y arrancar
por su sección. No hace falta releer el historial.
