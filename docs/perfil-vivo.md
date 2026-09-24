# El perfil vivo · diseño (2026-09-24)

> Estado: **aprobado**. Pieza 1 (§3, §5 y lo medido) **hecha el
> 2026-09-24**; ver «Lo construido» al final.
> Objetivo de fondo (fase 3): que una empresa describa a la persona que
> busca y Nüra encuentre a la mejor, con muchos parámetros y **explicando
> por qué**.

---

## 1 · Decisiones del fundador (2026-09-24)

1. **Los chats privados no se analizan.** Nunca, para nada.
2. **Las búsquedas no se analizan.** La frase se lee en el momento para
   encontrar al profesional y se olvida: no se guarda qué necesitó nadie,
   ni cómo habla, ni nada.
3. **Todo lo demás sí:** lo que el profesional escribe en su perfil, lo que
   se mide en la app y lo que dicen los clientes al terminar un servicio.
4. **Excepción, siempre con permiso:** Nüra puede *recordar una necesidad
   concreta* si la persona se lo pide, para ayudarla (sección 10). Nunca
   para saber cómo es.

## 2 · El principio: cada dato con su prueba

Cada cosa que Nüra sabe de un profesional guarda **de dónde sale**. La
empresa (y la propia persona) ven esa procedencia.

| Fuente | Ejemplos | Cómo se obtiene | IA | Coste |
|---|---|---|---|---|
| **Medido** | Contesta en menos de 1 h · 96 % de citas cumplidas · 14 clientes que repiten | Se calcula con lo que ya ocurre en la app | No | ~0 |
| **Dicho por clientes** | Paciente (38 clientes) · puntual · explica bien | Preguntas de un toque al terminar el servicio | Solo para resumir comentarios, por la noche | céntimos/día |
| **Declarado** | Tiene coche · habla inglés · trabaja con Alzheimer · 9 años de experiencia | Lo que escribe en su perfil; la IA lo ordena **cuando lo edita** y el profesional lo confirma | Sí, al editar | < 1 céntimo/edición |
| **Verificado** | DNI · título · antecedentes | Comprobación de documentos | No | según proveedor |

**Regla**: un rasgo sin prueba no se enseña. «Empática» solo aparece si
lo dicen clientes, y con cuántos lo dicen.

## 3 · Las preguntas al cliente (lo que más aporta)

Hoy, al terminar, se piden estrellas y un comentario opcional, y el
comentario **no sale del móvil**. Propuesta:

1. **¿Volverías a llamarle?** Sí / No (la señal más honesta).
2. **¿Qué destacarías?** 2–3 toques entre 5 opciones, que cambian según
   el oficio. Ejemplos:
   - Cuidado: *Paciente · Cariñosa · Puntual · De confianza · Resolutiva*
   - Clases: *Explica bien · Paciente · Motiva · Puntual · Se adapta*
   - Técnico: *Puntual · Limpio · Resolutivo · Precio claro · Explica*
3. Estrellas y comentario, como ahora (opcional).

Son toques, no texto: no hace falta IA para contarlos y no se pueden
malinterpretar. El comentario solo se usa si el cliente acepta que sea
público.

## 4 · Lo declarado, ordenado por IA

Cuando el profesional escribe o edita su perfil («tengo coche, llevo 9
años cuidando a personas con Alzheimer, hablo catalán e inglés»), la IA lo
convierte en datos concretos y **se los enseña para que los confirme**:

> ¿Es correcto? ✓ Tiene coche · ✓ 9 años de experiencia · ✓ Alzheimer ·
> ✓ Catalán · ✓ Inglés

Solo cuenta lo confirmado. Así la IA no inventa nada sobre nadie.

## 5 · Cómo se guarda

Una tabla nueva, `perfil_atributos`: una fila por dato.

| campo | ejemplo |
|---|---|
| `helper_id` | 552 |
| `clave` | `vehiculo`, `paciente`, `tiempo_respuesta` |
| `valor` | `true`, `38`, `"< 1 h"` |
| `fuente` | `medido` · `clientes` · `declarado` · `verificado` |
| `prueba` | «38 de 41 clientes» · «confirmado el 2026-10-02» |
| `actualizado_en` | fecha |

La ficha pública y, en la fase 3, la búsqueda para empresas leen de aquí.

## 6 · La fase 3 con este diseño

1. La empresa escribe: *«cuidadora con coche, paciente con Alzheimer, por
   las mañanas en Gràcia»*.
2. La IA lo traduce a criterios y busca en `perfil_atributos`.
3. Cada candidato llega con su porqué y sus pruebas.
4. **La persona decide si aparece en búsquedas de empresas** y puede ver y
   corregir todo lo que Nüra sabe de ella.

⚠ Usar IA para seleccionar personas para un trabajo es **alto riesgo** en
la normativa europea de IA: exige transparencia, supervisión humana y poder
explicar cada resultado. Este diseño lo facilita, pero necesita revisión
legal antes de abrirlo a empresas.

## 7 · Coste

La IA solo trabaja cuando pasa algo: una edición de perfil, un lote
nocturno de comentarios nuevos, una búsqueda. Con cientos de profesionales:
**euros al mes**. En la fase 3 cada búsqueda de empresa se cobra.

## 8 · Textos de consentimiento (borrador, pendiente de revisión legal)

- **Profesional, al darse de alta**: «Nüra construye tu perfil con lo que
  tú escribes, con lo que ocurre en tus servicios (por ejemplo, cuánto
  tardas en contestar) y con lo que opinan tus clientes. Nunca leemos tus
  chats. Puedes ver y corregir todo, y decidir si apareces en búsquedas de
  empresas.»
- **Cliente, al valorar**: «Tus respuestas ayudan a otros a elegir. Solo
  se publican si lo aceptas. Nunca leemos tus chats ni guardamos lo que
  buscas.»

## 10 · Recordar con permiso (aprobado 2026-09-24)

Regla: **Nüra solo recuerda algo de quien busca si esa persona dice que
sí**, guarda lo mínimo (nunca la frase), caduca y se puede borrar.

### «Te aviso si aparece alguien»
1. Si alguien busca y no contacta con nadie, o no hay resultados, Nüra
   ofrece: *«¿Quieres que te avise si llega un logopeda infantil a tu
   zona?»*.
2. Con un sí se guarda solo: *categoría · especialidad · zona*.
3. Caduca a los 3 meses (Nüra pregunta si sigue buscando).
4. En el perfil: *«Te aviso si aparece: …»*, con botón para quitarlo.
5. Cuando se da de alta o mejora su perfil un profesional que encaja, Nüra
   avisa. La comprobación compara datos ordenados: sin IA, sin coste.
6. **Avisos por las dos vías** (decisión del fundador): notificación del
   móvil y correo. Hace falta que quien busca pueda tener cuenta con correo,
   como los profesionales.

⚠ Hoy el botón «Avísame cuando tengas a alguien» responde «Anotado, te
aviso» **y no avisa**. Se arregla al construir esto.

### «Las personas de tu vida» (hecho el 2026-09-24)
Antes se guardaba sola (*«mi madre tiene Alzheimer»* → *Madre ·
Alzheimer* en el móvil). Ahora Nüra pregunta al final de la búsqueda:
*«¿Quieres que me acuerde de tu madre…?»* y solo guarda con un sí. Nunca
guarda la frase. Vive solo en el móvil y se borra desde el perfil.

## 9 · Orden de trabajo propuesto

1. Preguntas al cliente tras el servicio (sección 3) + tabla
   `perfil_atributos` + datos medidos.
1b. Cuentas con correo para quien busca + «te aviso si aparece alguien»
   (sección 10).
2. Lo declarado ordenado por IA con confirmación (sección 4).
3. La ficha pública enseña los rasgos con su prueba.
4. Fase 3: búsqueda para empresas, tras revisión legal.

## 11 · Lo construido

### Pieza 1 (2026-09-24)
- Cualidades por oficio: `src/utils/cualidades.js` (lista cerrada, repetida
  en `helpers-write` → `CUALIDADES`).
- Ventana: `src/components/RatingModal.jsx`, la única de la app.
- Servidor: operación `valorar` en `helpers-write`. El profesional sale de
  la conversación (llave de lectura), nunca del móvil.
- Base de datos: `supabase/migrations/20260925000000_perfil_vivo_valoraciones.sql`.
- Ficha: sección «Su historial en Nüra» en `HelperProfile.jsx`.
- Lo medido cuenta desde que el aviso se marca como enviado
  (`npm run avisar` llama a `aviso-enviado`), no desde que se escribió.
