# Perfil · Plan de rediseño

> Seis pasos. Al terminar cada uno se marca aquí y se dice **"sigue"** para
> el siguiente. Si se acaba el contexto, este documento dice por dónde
> continuar sin releer nada.

---

## El diagnóstico

Medido en la app tal y como está:

| | usuario | profesional |
|---|---|---|
| alto | 1.211px · 1,4 pantallas | **2.003px · 2,4 pantallas** |
| bloques con fondo | 10 | **15** |
| acciones | 10 | 14 |

### Lo primero que se lee

> *"Sergio · En Nüra desde julio de 2026 · 600123456 ·* **Tu perfil está al
> 67%** *· Mejora tus matches · Añade: una foto"*

Y en el profesional, **al 29%** con cinco cosas que le faltan.

**El perfil abre con un reproche.** Lo primero que ve alguien al entrar en
su propio espacio es una nota baja y una lista de deberes.

Y en el caso del usuario es peor: **¿completar qué?** Un usuario no tiene
perfil que rellenar — solo busca ayuda. El porcentaje le pide algo que no
necesita para nada.

### Las cuatro zonas de hoy

| zona | qué contiene |
|---|---|
| 1 · Identidad | nombre, teléfono, **el porcentaje** |
| 2 · Actividad humana | qué has hecho / tu semana |
| 4 · Evolución | *"¿tienes algo que ofrecer?"* / publicar |
| 5 · Configuración | ajustes, cerrar sesión |

*(No hay zona 3: se retiró en algún momento y la numeración quedó rota.
Síntoma de que nadie ha mirado esta pantalla entera desde hace tiempo.)*

---

## Los seis pasos

### Paso 1 · Fuera el porcentaje ✅ *(2026-08-16)*

| | antes | ahora |
|---|---|---|
| usuario | *"Tu perfil está al **67%** · Mejora tus matches · Añade: una foto"* | **nada** — va directo a su actividad |
| profesional | *"Tu perfil está al **29%** · Añade: tu formación · tu zona · tu tarifa · qué te diferencia · una foto"* | *"**Añade tu formación** · Es lo que más mira quien duda."* |

**Al usuario se le pedía algo que no necesita**: no tiene perfil que
rellenar, solo busca ayuda.

**Al profesional sí le conviene**, pero como invitación concreta: **una sola
cosa** —la que más le falta— con el motivo por el que le interesa. Cinco
deberes a la vez no se hacen; uno con razón, sí.

Cada campo tiene su porqué escrito: *"sin ella no apareces en las
búsquedas"*, *"quien no la ve, casi nunca escribe"*, *"los perfiles con foto
reciben más mensajes"*.

### Paso 2 · La identidad, como la ficha ✅ *(2026-08-16)*

| | ficha | perfil antes | perfil ahora |
|---|---|---|---|
| el nombre | 28px | **22px** | 28px |
| debajo | *"Logopeda infantil · Verificado"* | *"En Nüra desde julio"* | *"**Logopeda infantil** · desde julio"* |

**Un profesional no veía su propio oficio en su perfil**, mientras cualquiera
que abre su ficha lo lee lo primero. El oficio manda; la fecha pasa detrás.

Al usuario no se le inventa nada: sigue viendo su fecha de alta, porque no
tiene oficio que mostrar.

### Un fallo encontrado por el camino

`.identity` declaraba **`gap` dos veces**: `var(--space-16)` y luego
`gap: 6px`, que lo pisaba. Por eso el avatar quedaba pegado al nombre.

Es el tipo de resto que deja una pantalla que nadie mira entera — como la
numeración de zonas rota (1, 2, 4, 5) anotada en el paso 1.

### Paso 3 · Una cosa por bloque ✅ *(2026-08-16)*

**Profesional: 15 → 12 bloques.**

### Marta veía el perfil de un usuario

El bloque *"Tu actividad · **Aún no has buscado a nadie** · Cuéntame qué
necesitas y te busco a la persona"* **no comprobaba el rol**.

Una profesional entraba en su propio perfil y la app le hablaba como si
buscara ayuda — cuando ella la ofrece. Ahora ese hueco vacío es solo del
usuario, y el título cambia: *"Tus cosas"* para ella, *"Tu actividad"* para
él.

*(Los enlaces a Mis servicios y Siguiendo se quedan para los dos: esos sí
sirven a ambos.)*

### Tres botones para publicar

Había **tres** en la misma pantalla:

| dónde | qué pasó |
|---|---|
| *"Así te ven quienes te necesitan"* | **se queda** — junto a la vista previa de su ficha |
| *"¿Has ayudado a alguien?"* | retirado — **lo añadí yo** al fundir Comunidad, duplicando uno que ya existía |
| *"Tu semana"* → *Publicar en tu obra* | ahora *"Ver cómo te ven"* |

El de *"Tu semana"* no era un descuido: su acción depende del contexto y,
sin nada pendiente, caía en publicar. Pero **cuando no hay nada pendiente lo
útil es ver cómo te ven** — de ahí sale el impulso de publicar, no al revés.

**Dos botones para lo mismo no es más fácil de encontrar: es una pantalla
que no sabe cuál es el gesto.**

### Paso 4 · Las subpantallas ✅ *(2026-08-16)*

**Dos descuadres entre pantallas hermanas:**

| | antes | ahora |
|---|---|---|
| título de *Mis servicios* | `y=92` | `y=76` |
| título de *Siguiendo* | `y=76` | `y=76` |
| lista de *Chats* | a **14px** del borde | 16px |

*Mis servicios* sumaba 8px de relleno **más** 8px de margen en el título.
Al pasar de una subpantalla a otra, el título saltaba 16px.

### Y los números, en español

En *Siguiendo* ponía **`4.9 · 0.8km`**. En Inicio, *"0,8 km"*. En las
tarjetas, *"a 0.8 km"*. **Tres maneras de escribir el mismo dato.**

La valoración y la distancia se pintaban en **quince sitios de siete
ficheros**, cada uno a su manera. Ahora todos pasan por
`utils/formato.js`: coma decimal y espacio antes de la unidad, como se
escribe en español.

**El guardia nuevo encontró uno que mi búsqueda se saltó** — *"es el más
cercano — a 0.8 km"*. Y con él un fallo latente: si faltaba la distancia,
la app habría escrito literalmente *"a **?** km"*.

Guardia en la Cuarta Puerta, probado devolviendo el bug.

### Paso 5 · El profesional ve lo suyo ✅ *(2026-08-16)*

**Se iba a decidir dónde poner el panel del profesional. Al medirlo apareció
algo más grave: las cifras eran inventadas.**

```js
const vistasHoy = 1 + (h % 5)              // 1-5
const busquedasSemana = 4 + ((h >> 3) % 9) // 4-12
```

Salen de un *hash* de la fecha y el nombre. **No miden nada.** Y se mostraban
también en producción: a una profesional real, Inicio le decía

> *"Mientras no mirabas, **3 personas vieron tu perfil** hoy y hubo **9
> búsquedas** en tu zona. Tu escaparate está activo ✨"*

sin que nadie la hubiera visto ni buscado.

En la demo es aceptable —enseña cómo se verá—. **En producción es mentirle a
alguien sobre su negocio**, y el día que lo descubre, Nüra pierde a esa
persona y a todas a las que se lo cuente.

**Corregido en el origen**: `proSignals()` devuelve `null` fuera de la demo.
Ninguna pantalla puede volver a mostrarlas en producción sin decidirlo.

| | demo | producción |
|---|---|---|
| Inicio | *"1 persona vio tu perfil… 4 búsquedas"* | *"Tu perfil está publicado. Cuando alguien te escriba, te llegará un aviso con su mensaje."* |
| Perfil | fila de cifras | **sin fila** |

La frase de producción dice solo lo que es verdad — y lo del aviso lo es:
Nüra lo encola y el profesional lo recibe.

### Y un fallo que ya estaba en la demo

`(h >> 3)` usaba desplazamiento **con signo** sobre un hash **sin signo**.
Medido en 1.600 combinaciones de fecha y nombre: **341 daban negativo**. Un
día de cada cinco, la demo decía *"hubo **-1 búsquedas** en tu zona"*.
Corregido a `>>>`.

### La decisión del panel

Sin las cifras falsas, lo que queda —*Tu semana*, *Así te ven*, *Tu primer
paso*— **es real y es suyo**: mensajes abiertos, citas, su ficha tal como la
ven otros. Se queda donde está.

**Cuando existan métricas reales** (la tabla `eventos` ya recoge contactos),
saldrán de ahí.

### Paso 6 · Configuración al final ✅ *(2026-08-16)*

**Al fondo del perfil:**

| | antes | ahora |
|---|---|---|
| sellos de versión | **dos, contradictorios**: *"Nüra 2 · 2026.07.08"* y *"Nüra · v1.0"* | uno, lo último de la pantalla |
| *Cerrar sesión* | encajado **entre** los dos sellos | antes del sello |
| *"Próximamente · tu reputación profesional"* | también al **usuario** | solo al profesional |
| zonas del código | 1, 2, 4, 5 | 1, 2, 3, 4 |

### Dos fallos míos de pasos anteriores, encontrados aquí

**1 · Dos ventanas de publicar a la vez.** En el paso 3 retiré el botón
duplicado pero **dejé su ventana montada** — y ya había otra al final del
fichero. Un solo toque en *"Publicar"* abría **dos ventanas superpuestas**.
Medido en navegador: 2. Ahora 1.

**2 · Ceros para el profesional.** Al ocultarle a Marta el hueco vacío del
usuario (paso 3), cayó en la otra rama y veía *"**0** búsquedas realizadas ·
**0** profesionales contactados"*. El propio código ya lo prohibía: *"un cero
grande no informa, solo rellena"*.

Verificados los tres estados:

| | la zona dice |
|---|---|
| usuario nuevo | *"Aún no has buscado a nadie. Cuéntame qué necesitas…"* |
| usuario con actividad | *"1 búsqueda realizada · 0 profesionales contactados"* |
| profesional nuevo | directo a sus enlaces, **sin ceros** |

---

# 🏁 PERFIL COMPLETO

Seis pasos. Lo que cambió, en una línea cada uno:

1. **Ya no abre con una nota** — *"Tu perfil está al 67%"* fuera
2. **Se presenta como la ficha** — nombre a 28px y el oficio debajo
3. **Marta ve el perfil de una profesional**, no el de un usuario
4. **Las subpantallas encajan** — y los números, en español
5. **Ninguna cifra inventada en producción**
6. **Lo último es lo último** — un sello, cerrar sesión, nada más

Y cuatro fallos que no se buscaban: el `gap` duplicado, el `-1 búsquedas`,
las dos ventanas de publicar y los ceros. **Dos de los cuatro los había
metido yo en pasos anteriores** — el último paso sirvió también para
revisar los primeros.


Lo que más daña y lo más rápido. El perfil deja de abrir con una nota.

- Para el **usuario**: el porcentaje desaparece. No tiene nada que
  completar.
- Para el **profesional**: sí tiene sentido sugerirle qué falta —un perfil
  incompleto recibe menos contactos— pero **como invitación concreta**, no
  como nota: *"Añade tu tarifa y te encontrarán antes"* en vez de *"estás al
  29%"*.

### Paso 2 · detalle

La cabecera del perfil debe parecerse a la ficha de un profesional: foto
grande, nombre, y debajo lo que eres. Hoy son tres líneas sueltas con el
teléfono en medio.

Coherencia con lo ya hecho: `HelperProfile` ya resolvió esto.

### Paso 3 · detalle

Quince bloques con fondo en el perfil del profesional. Cada uno compite con
el siguiente. Fundir lo que es lo mismo y retirar lo que no sirve a nadie.

### Paso 4 · detalle

`Mis servicios` y `Siguiendo` se llegan desde aquí y tienen su propio
diseño. Revisar que sean la misma app: título, márgenes, tarjetas.

*(Parcialmente hecho en la etapa 6 del plan anterior — verificar y
completar.)*

### Paso 5 · detalle

El perfil del profesional muestra *"TU SEMANA · Semana tranquila · 0
abiertas"*. Eso es un panel, y está en el sitio equivocado: mezclado con sus
ajustes personales.

Decidir si se queda, se mueve o se retira.

### Paso 6 · detalle

Ajustes y cerrar sesión deben ser lo último y lo más discreto. Verificar que
lo son.

---

## Cómo se trabaja

Un paso por vez. Para cada uno:

1. **Medir** antes de tocar
2. **Implementar** solo ese paso
3. **Verificar**: build, lint, suite, smoke, rutas, recorrido, AA
4. **Documentar**, commit, push
5. Marcar aquí y esperar el siguiente **"sigue"**

**Reglas fijas**: nunca romper AA, el navegador manda sobre la teoría, y si
un paso exige una decisión de producto se para y se pregunta.
