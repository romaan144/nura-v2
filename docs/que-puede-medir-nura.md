# Qué puede medir Nüra sobre sí misma

*Auditoría del 2026-08-02. Sin implementar nada: elegir herramienta y qué
medir es decisión del fundador. Esto solo pone el problema encima de la
mesa con números.*

---

## El hallazgo, en una frase

**Nüra registra mucho y no te llega nada.**

Todo lo que sabe sobre su propio uso vive en el `localStorage` del móvil de
cada persona y muere ahí. **No existe telemetría de ningún tipo** —ni
analítica, ni errores, ni producto— verificado sobre todo el árbol.

Lo único que sale del dispositivo son lecturas de la tabla `helpers` y dos
escrituras: el alta profesional y **`chat_log`, el contenido de las
conversaciones**.

Es decir: de todo lo que ocurre en Nüra, lo único que viaja es lo más íntimo
y lo menos útil para saber si el producto funciona.

---

## Lo que ya se registra (y se queda en el móvil)

| clave | qué guarda | valor para medir |
|---|---|---|
| `nura_search_history` | cada búsqueda con su categoría | **alto** — es la demanda real |
| `nura_demanda_no_cubierta` | consultas sin nadie que las atienda | **el más alto**: dice qué oferta falta |
| `nura_contacted` | a quién se ha escrito | **alto** — el primer paso de conversión |
| `nura_services` · `nura_citas` | servicios y citas | **alto** — la conversión de verdad |
| `nura_ratings` | valoraciones dadas | alto |
| `nura_history` | conversaciones con Nüra | medio |
| `nura_following` · `nura_utiles` | seguimientos y reacciones | medio |

Ninguna de estas llega a ningún servidor.

---

## Las preguntas que deciden si Nüra funciona

Del documento de fundación, los criterios para graduar el MVP. Al lado, si
hoy podrías responderlos:

| pregunta | ¿responde hoy? |
|---|---|
| ¿Cuánta gente busca algo? | **No** |
| ¿Qué piden, con sus palabras? | **No** |
| ¿Para qué no tenemos a nadie? | **No** ← y es la que dirige a quién reclutar |
| ¿Cuántos escriben a alguien tras la recomendación? | **No** |
| ¿Cuántos contactos acaban en servicio? | **No** |
| ¿Cuántos vuelven a los 90 días? | **No** |
| **100 conexiones completadas** (criterio de graduación) | **No** |

**Cero de siete.**

Si abres a treinta personas mañana, al mes tendrás exactamente la misma
información que hoy: la que te cuenten por WhatsApp.

---

## El conjunto mínimo de eventos

Seis. Ni uno más al principio: cada evento que no se vaya a mirar es ruido
y una obligación de privacidad.

| evento | cuándo | qué lleva |
|---|---|---|
| `busqueda` | al analizar una consulta | categoría, si se entendió, nº de resultados |
| `sin_cobertura` | cuando no hay nadie compatible | categoría, zona |
| `recomendacion_vista` | al pintar resultados | categoría, posición del primero |
| `contacto` | al abrir chat con un profesional | categoría, si venía de recomendación |
| `servicio_confirmado` | al confirmar una cita | categoría |
| `resultado_registrado` | al cerrar con un resultado | categoría, si hay valoración |

**Sin el texto de la consulta.** Basta la categoría para decidir a quién
reclutar, y guardar las frases de la gente en un servidor de analítica es
otra cosa —consentimiento, retención, responsabilidad— que no hace falta
para responder las siete preguntas.

Los cuatro primeros dan el embudo. Los dos últimos dan el criterio de
graduación.

---

## Lo que hay que decidir (no está decidido)

1. **Si medir.** Es defendible no hacerlo con treinta usuarios y
   preguntarles a mano — y aprender más. Con trescientos, ya no.
2. **Con qué.** Una tabla `eventos` en el Supabase que ya existe es lo más
   barato y no añade terceros a un producto cuya tesis es la confianza. Una
   herramienta externa da paneles a cambio de enviar datos fuera.
3. **Qué contar como conexión.** «100 conexiones completadas» necesita una
   definición antes de poder contarse: ¿contacto?, ¿cita confirmada?, ¿cita
   con resultado registrado? La tercera es la única que mide lo que Nüra
   dice ser.

---

## Nota de método

Este censo se hizo **dos veces**. La primera contaba `setItem`/`getItem` y
daba doce claves «que nadie lee»: falso, porque casi todo pasa por los
ayudantes `save()`/`load()` de `UserContext`. Decimotercera vez en la
jornada que el instrumento se equivoca antes que el código.
