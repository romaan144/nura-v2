# NÜRA 2 — CONTEXTO DE PRODUCTO

> Qué es Nüra 2 y qué está construido, en lenguaje de producto.
> El cómo técnico vive en `architecture.md`. El porqué, en `manifesto.md`.
> Lo incierto está marcado [PENDIENTE]. Última actualización: 2026-07-04

---

## 1. Qué es

Nüra es una plataforma de IA que conecta personas que necesitan ayuda con
personas reales capaces de ayudarlas, mediante conversación natural
(ver `manifesto.md`). Nüra 2 es la generación activa del producto: una
reinterpretación completa construida sobre todo lo aprendido en la versión
original, con el objetivo de sentirse adelantada a su tiempo, extremadamente
humana, elegante e intuitiva.

## 2. Los dos proyectos (regla crítica)

| | Nüra 1 | Nüra 2 |
|---|---|---|
| Estado | **CONGELADA** — solo bugs críticos con petición explícita | **Desarrollo activo** — aquí va todo lo nuevo |
| Repo | `github.com/romaan144/nura-app` | `github.com/romaan144/nura-v2` |
| Deploy | `nura-app-pied.vercel.app` | `nura-v2-two.vercel.app` |

Nüra 2 nació como copia exacta de Nüra 1 y evoluciona de forma independiente.
Nüra 1 sirve de demo de respaldo estable para inversores.

## 3. El ciclo del usuario — funcionalidades construidas

Todas en producción. Descripción de producto; mecánica exacta en
`architecture.md`.

**Llegada**
1. **El Momento Cero** — antes de pedir nada, Nüra demuestra que funciona:
   una conexión real ocurre en pantalla en cuatro fases (necesidad → análisis →
   match → resultado), con historias que rotan según la hora. Aparece la primera
   vez y con moderación después: el wow se protege, no se gasta.
2. **La Pregunta** — en sesiones frescas, antes del texto: "¿Para quién necesitas
   ayuda?" (Para mí / familia / hogar). Un toque personaliza tono, input y
   matching. Cede prioridad a la memoria cuando existe.

**Búsqueda**
3. **La Comprensión Visible** — Nüra muestra lo que entendió en chips
   ("Para tu madre · Compañía y cuidado · Urgente") antes de los resultados;
   tocar un chip abre corrección por texto libre que relanza la búsqueda
   combinada. La inteligencia se ve — y se puede corregir.
4. **La Revelación Progresiva** — los resultados llegan como los encuentra la
   IA: primero la recomendación con convicción y razones ("✦ De todos los
   profesionales, Elena es mi recomendación para tu madre — …") con su tarjeta
   destacada; después "También encajan:" y las alternativas cayendo una a una.
   Una respuesta, no una estantería. Todo dentro del chat.

**Conocer y contactar**
5. **El Perfil como Historia** — perfil editorial: la persona como protagonista,
   números presentados como logros, su cita en tipografía de voz, reseñas como
   conversaciones reales, y la recomendación de Nüra antes del CTA.
6. **La Carta de Presentación Viva** — al contactar, Nüra redacta el primer
   mensaje en nombre del usuario a partir del contexto real de su búsqueda;
   editable y regenerable. El profesional responde reconociendo el contexto:
   nadie tiene que explicarse dos veces. En demo, la conversación continúa
   **viva**: reconocimiento con nombre propio ("será un placer ayudar con tu
   madre"), ritmo humano de escritura y un siguiente paso concreto — día y
   franja — aceptable con un toque ("✓ Acordado").

**Después del contacto**
7. **La Confirmación Humana** — pasado un tiempo, Nüra pregunta:
   "¿Pudiste resolver lo que necesitabas [para tu madre] con Elena?" Sí/No.
   Es la semilla del sistema de reputación por resultados verificados.
8. **La Memoria Viva** — Nüra retoma la relación al volver: "¿Cómo está tu
   madre? Me alegra que Elena esté con vosotros."
9. **El Espejo** — Nüra modela a las **personas** de la vida del usuario
   (su madre, su hijo) con sus circunstancias, a partir de lo que cuenta de
   forma natural. Esa memoria alimenta el saludo, la carta, la confirmación y
   los chats — y es **visible y borrable** en el perfil del usuario
   ("Las personas de tu vida").
10. **Chats con memoria** — cada conversación anotada con su contexto humano:
    "Te ayuda con tu madre · ✓ funcionó".

**Descubrimiento y comunidad**
11. **Explorar por necesidades** — categorías en primera persona
    ("Cuidar a alguien querido", "Arreglar algo en casa"), no taxonomía de
    directorio.
12. **El Escaparate Vivo** — profesionales "Activos ahora" con señales de
    actividad reciente: Nüra se siente viva antes de buscar nada.
13. **El Muro de Conexiones** — la pestaña de comunidad es prueba social
    verificada: historias reales de conexiones que funcionaron, con las del
    propio usuario primero ("✓ Tu conexión"). La pestaña Siguiendo conserva los
    posts de los profesionales seguidos.

**Lado del profesional**
14. **El Pulso** — resumen periódico con lo que pasó con su perfil esa semana
    y una sugerencia accionable: inteligencia de mercado, no un dashboard.

**Infraestructura de producto:** sistema de diseño propio, La Voz Tipográfica,
accesibilidad base, búsqueda unificada en una sola arquitectura, configuración
central demo/producción y sello de versión visible
(detalles en `design-system.md` y `architecture.md`).

## 4. Datos de demostración

Nüra 2 funciona íntegramente con un catálogo local de profesionales demo ricos
(perfiles, reseñas, historias) que sostiene la búsqueda, el Escaparate y el Muro
**sin depender de la base de datos remota**. Los profesionales remotos se suman
cuando la conexión responde. Detalle técnico en `architecture.md`.

## 5. Pendientes (sección evolutiva)

> Esta sección cambia constantemente; es la semilla de un futuro `state.md`.

- [PENDIENTE] Confirmación en dispositivo real del flujo de búsqueda.
  Código **certificado** el 2026-07-04 (barrido ESLint completo + ejecución real
  del pipeline + auditoría de rutas — ver `changelog.md`); sello `2026.07.04-a`
  visible en el Perfil. Resta solo la comprobación visual en dispositivo.
- [PENDIENTE] Clasificación: "clases de inglés" cae en categoría interna
  'matematicas' (el mejor match sigue siendo correcto por palabras clave; el
  chip de comprensión de categoría se omite). Afinar `analyzeNeed`.
- [PENDIENTE] Al lanzar producción: cambiar el interruptor demo en la
  configuración central (un solo cambio; ver `architecture.md`).
- [PENDIENTE] Plan de empresa y PDFs de negocio: no disponibles en la sesión que
  generó esta documentación; reincorporar sin inventar contenido
  (futuro `business.md`).
- [PENDIENTE] Scroll automático del chat durante la Revelación Progresiva.
- [PENDIENTE] Touch targets mínimos 44px en botones circulares de cabecera.
- [PENDIENTE] Los chips de la rama negativa de la Confirmación Humana
  ("Sí, busca otra persona") aún fluyen como texto de búsqueda literal.
- [PENDIENTE] Historia oficial del nombre para materiales de marca
  (`manifesto.md`).

## 6. Glosario rápido

**Helper/Profesional** — persona que ofrece ayuda. **Persona (El Espejo)** —
entidad de la vida del usuario (su madre, su hijo) que Nüra recuerda.
**Conexión verificada** — contacto confirmado como resuelto por quien lo vivió.
**Demo mode** — comportamiento acelerado de tiempos para demostraciones.
