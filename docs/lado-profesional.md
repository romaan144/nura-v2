# El lado del profesional no existe

*Conducido el ciclo completo del profesional dentro de la app, 2026-08-08.
Sin tocar código: lo que falta no es un arreglo, es media aplicación.*

---

## Lo que se ve al entrar como profesional

Se simuló a **Carlos Martínez Vidal**, logopeda, el `id=1` del dataset, con
cuenta `isHelper: true`. Esto es lo que le muestra Nüra hoy:

| pantalla | lo que ve | lo que debería ver |
|---|---|---|
| `/chats` | *"Carlos Martínez Vidal · 58m · Perfecto, el jueves a las 17h…"* — **un chat consigo mismo** | quién le ha escrito |
| `/my-services` | *"Aún no has contratado nada. Cuando **contrates a un profesional**…"* | su agenda de la semana |
| `/profile` | correcto: 86%, *"Más completo, más contactos"*, TU SEMANA | — |

**Solo el perfil le habla a él.** Las otras dos le hablan como si fuera un
cliente que busca ayuda.

---

## La causa: no es un fallo, es una ausencia

`Chats.jsx`, `Chat.jsx` y `MyServices.jsx` **no miran `isHelper` en ninguna
línea**. Verificado con grep sobre los tres ficheros.

`isHelper` se usa en seis sitios —perfil, feed, alta, onboarding, barra
lateral, inicio— y en **ninguna** de las pantallas donde un profesional
haría su trabajo.

Y por debajo hay algo más profundo. Los mensajes viven en
`chatHistories` dentro de `UserContext`, es decir, **en el `localStorage`
del móvil de quien escribe**:

```js
function saveChatHistory(helperId, messages) {
  setChatHistories(prev => ({ ...prev, [String(helperId)]: messages }))
}
```

Un mensaje que un usuario le manda a Carlos **nunca sale del móvil de ese
usuario**. Carlos no puede verlo aunque hubiera una pantalla para
enseñárselo. La app entera está construida sobre almacenamiento local, y
una bandeja de entrada exige lo contrario: un mensaje escrito en un
dispositivo y leído en otro.

---

## Qué significa esto

Nüra funciona hoy como **un buscador con demo de conversación**. Encuentra
a la persona adecuada y explica por qué. Eso está bien hecho y verificado.

Lo que no existe es la otra mitad: **que la persona encontrada se entere.**

Es coherente con lo que fue apareciendo toda la auditoría —el `await` que
hacía invisibles a los profesionales autodados de alta, el alta que daba la
enhorabuena sin publicar, el medidor que les decía 33% habiendo contestado
a todo—. Ninguno de esos fallos se había notado porque **nunca ha pasado un
profesional real por la app**. Este es el mismo hueco, visto entero.

---

## Lo que impedía las TRES salidas (corregido el 2026-08-08)

Antes de elegir canal: **el alta profesional no pedía ningún dato de
contacto**, y ningún perfil del dataset tiene teléfono ni correo.

Un profesional podía completar las seis preguntas, aparecer en las
búsquedas y ser **inalcanzable para siempre**. Ni A (avisarle), ni B
(notificarle), ni siquiera C (*"ya le llamas tú"*) eran posibles: no había
número al que llamar.

**Corregido**: séptima pregunta al final del alta —*"Y lo más importante:
¿cómo te avisamos cuando alguien te necesite?"*—. Va la última a propósito:
se pide cuando la persona ya ha invertido en su perfil, no en la puerta.

**Es un dato personal y no viaja al navegador**: `contacto` entra en
`COLUMNAS_OCULTAS` junto a `chat_log`, así que las lecturas públicas nunca
lo piden. Solo lo ve quien tiene la clave de servicio — es decir, quien
tiene que avisar.

*(Requiere `alter table helpers add column contacto text;` en Supabase.)*

## Y el chat fingía que el profesional contestaba (corregido el 2026-08-08)

Al conducir el contacto real apareció lo más grave de todo. Un usuario
escribía *"mi hijo de 5 años no pronuncia la R"* y **Carlos respondía al
instante**: *"¡Hola! Soy Carlos. ¿En qué puedo ayudarte?"*.

Carlos no ha visto nada. Carlos no va a contestar. Las respuestas están
guionizadas en `chatReplies.js` y **no miraban `DEMO_MODE`**: habrían
corrido igual en producción.

Con demo es una demostración legítima. Sin demo es **mentirle a una persona
sobre otra persona real**, y en un producto cuya tesis es la confianza esa
es la mentira más cara que se puede contar.

**Corregido**: en producción el chat no finge. Dice la verdad:

> *"Escríbele a Carlos. Le aviso de que le has escrito y te traigo su
> respuesta aquí."*
> *"Mensaje enviado. Aviso a Carlos de que le has escrito; en cuanto
> responda te llega aquí."*

Verificado en las dos ramas: en demo, la conversación simulada completa; en
producción, ninguna respuesta fingida.

**Esto convierte la elección de canal en una promesa pendiente.** La app ya
dice *"le aviso"*. Hasta que exista el aviso —salida A, B o C— esa frase es
una intención, no un hecho. Es el argumento más fuerte para elegir A pronto.

## Las tres salidas

**A · WhatsApp como bandeja de entrada.** Cuando alguien contacta, al
profesional le llega un mensaje o un correo con el contexto que Nüra ya
sabe redactar (`buildChatOpener` existe y funciona). La conversación
continúa fuera. **Coste: bajo.** Nüra sigue siendo el sitio donde se
encuentran, no donde hablan. Encaja con no cobrar comisión: si no vives de
la transacción, no necesitas retenerla.

**B · Bandeja de entrada real dentro de Nüra.** Mensajes en Supabase,
cuentas de profesional de verdad, notificaciones. **Coste: alto** — es la
mitad de una aplicación de mensajería, con su sincronización, su estado de
leído y su privacidad. Es lo correcto si La Obra —el registro de qué
resolvió quién— vive dentro del producto.

**C · No hacer nada todavía.** Con un piloto de treinta personas, el
primer profesional se entera porque le llamas tú. Se aprende más de esas
llamadas que de una bandeja de entrada construida a ciegas.

---

## El texto del aviso, ya escrito (2026-08-08)

`src/utils/aviso.js`. **Agnóstico del canal a propósito**: las tres salidas
necesitan exactamente el mismo texto, así que escribirlo no adelanta la
decisión.

```
Hola Marta, soy Nüra.
Sergio te ha escrito buscando ayuda:

«Hola Marta, mi hijo de 5 años no pronuncia la R. Nüra te ha
 recomendado por tu experiencia como logopeda infantil. ¿Podrías
 ayudarme?»

Puedes responderle desde Nüra. Si no te viene bien, no pasa nada —
dilo y buscamos a otra persona.
```

Reutiliza `buildChatOpener`, que ya redacta la presentación en las palabras
del usuario. Tres decisiones dentro:

- **No lleva los datos de contacto del usuario.** Dar el teléfono de una
  madre a alguien que aún no ha dicho que sí es otra cosa. El profesional
  responde dentro de Nüra, que es donde queda el registro.
- **Ofrece decir que no.** Un aviso que solo admite el sí presiona, y la
  gente que no puede simplemente no contesta — y entonces no sabes si es un
  no o un descuido.
- **Si no hay contacto válido, devuelve `null`.** No inventa un aviso que no
  se puede enviar.

`enlaceDeAviso()` construye `wa.me` o `mailto` con el mensaje ya escrito,
así que **la salida A funciona sin backend**: la abre quien avisa.

Ocho pruebas en la suite dorada.

## Y cómo mandarlo hoy: `npm run avisar`

```bash
NURA_EDGE_URL=https://<tu-proyecto>.functions.supabase.co/helpers-write \
  npm run avisar -- --id 1 --mensaje "Hola Marta, soy Nüra. Sergio te ha…"
```

Devuelve un enlace `wa.me` o `mailto` con el mensaje ya escrito. Lo abres y
lo envías. **Sin backend, sin panel, sin servicio de terceros.**

**Es un guion y no una pantalla por dos razones.** La primera es técnica: el
`contacto` no viaja al navegador a propósito, así que una pantalla dentro de
la app no puede verlo. El aviso se arma en la Edge Function (operación
`avisar`), que tiene la clave de servicio, y de ahí **solo sale el enlace,
nunca la lista de teléfonos**.

La segunda importa más: con treinta personas, **quien cumple la promesa eres
tú, a mano**. Eso no es una versión pobre — es la correcta. Cada aviso que
mandas te enseña quién contesta, en cuánto tiempo y con qué palabras. Un
panel automático te ahorraría ese trabajo y te quitaría ese aprendizaje.

Si un profesional se dio de alta antes de que el alta pidiera contacto, el
guion lo dice claro: **aparece en las búsquedas y nadie puede avisarle.**

## Recomendación

**A ahora, C mientras tanto, B solo cuando el volumen lo pida.**

El motivo no es de esfuerzo: es que **el contenido del primer mensaje
importa más que el canal**. Nüra ya sabe redactar la presentación en las
palabras del usuario, que es lo que elimina la barrera del primer contacto.
Que eso llegue por WhatsApp o por una bandeja propia es secundario los
primeros meses.

Y hay una pregunta que se responde sola en cuanto hables con el primer
profesional real: **preguntarle por dónde quiere recibir los avisos**. Su
respuesta decide esto mejor que cualquier análisis.

---

## Anotado, sin tocar

- `/my-services` le dice al profesional *"Cuando contrates a un
  profesional…"*. Aunque no se construya la bandeja, **ese texto está mal
  para él** y es un arreglo de diez minutos el día que se decida el camino.
- Los chats sembrados incluyen uno **del propio profesional consigo mismo**
  cuando su `helperId` coincide con uno de la demo. Solo ocurre en modo
  demo y desaparece con `DEMO_MODE=false`.
