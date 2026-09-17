# Nüra · Revisión profunda

> Escrito el 2026-08-16, después de que el fundador dijera: *"No me gusta
> nada. Le falta intuición. La gente al entrar no sabe de qué va, no es
> cómoda, está todo escondido, es feo."*
>
> **Este documento no propone píxeles.** Propone qué es Nüra y qué sobra.

---

## Primero: por qué el trabajo anterior no sirvió

Las últimas horas fueron ocho etapas de rediseño más cuatro correcciones de
coherencia. Todo medido, todo verificado, todo verde. **Y la app sigue sin
gustar.**

El motivo, y hay que escribirlo para no repetirlo:

**Estuve arreglando la superficie de un producto cuyo problema es la
estructura.** Unificar curvas no hace que alguien entienda para qué sirve
Nüra. Poner cristal no hace que encuentre lo que busca.

Un producto se entiende o no se entiende **antes** de que el usuario note si
las esquinas son redondas.

---

## El diagnóstico, con números

Medido en la app tal y como está hoy:

| pantalla | acciones tocables | alto |
|---|---|---|
| Inicio | 11 | 1 pantalla |
| Profesionales | 19 | 1,8 |
| **Comunidad** | **91** | **8,4** |
| Chats | 10 | 1 |
| Perfil | 12 | 1,4 |

### Problema 1 · Nadie sabe de qué va

Lo primero que lee alguien que entra:

> *"BIENVENIDO · La IA que conecta personas reales · Cuéntale a Nüra lo que
> necesitas con tus palabras."*

Suena bien y **no dice qué hace**. "Conecta personas reales" puede ser una
red social, una app de citas, un foro. Falta lo concreto: *encuentras a un
fontanero, una logopeda, alguien que cuide a tu madre*.

Y si alguien salta el onboarding, la app le llama **"Usuario"**. Literal:
*"Buenos días, Usuario"*. Es el primer saludo de un producto que va de
calidez.

### Problema 2 · Cinco pestañas para una sola cosa

Nüra tiene **cinco destinos** en la barra: Buscar, Profesionales, Chats,
Comunidad, Perfil.

Pero el producto hace **una cosa**: *cuéntame tu problema y te digo a quién
llamar*. Cuatro de las cinco pestañas no sirven a eso:

- **Profesionales** es un segundo buscador — hace lo mismo que Inicio, con
  otra puerta
- **Comunidad** es un muro de 91 acciones y 8,4 pantallas que no ayuda a
  encontrar a nadie
- **Chats** está vacío hasta que escribes a alguien
- **Perfil** dice *"Tu perfil está al 67%"* a alguien que no tiene perfil
  que completar

**Cinco puertas no es más funcionalidad: es no haber decidido.**

### Problema 3 · Lo importante está escondido

Lo que hace único a Nüra —que entiende un problema contado con palabras
normales— vive en una cápsula de escribir al fondo de Inicio, sin explicar
qué se puede escribir dentro.

Lo que sobra ocupa el sitio: categorías genéricas, un muro de historias,
un porcentaje de perfil.

---

## Lo que propongo

### A · Nüra dice lo que hace, en una frase

Cambiar la promesa por una que nombre cosas concretas:

> *"¿Se te ha roto algo? ¿Necesitas a alguien que cuide a tu madre? ¿Un
> profesor para tu hijo? Cuéntamelo como se lo contarías a un amigo."*

Con ejemplos reales en la primera pantalla, no genéricos. Alguien tiene
que entender de qué va **antes de tocar nada**.

**Y nadie se llama "Usuario".** Si no da su nombre, Nüra no lo usa.

### B · De cinco pestañas a dos

| ahora | propuesto |
|---|---|
| Buscar · Profesionales · Chats · Comunidad · Perfil | **Nüra** · **Tus conversaciones** |

- **Nüra** — la conversación. Buscar, explorar y recomendar en un solo
  sitio. Las categorías dejan de ser una pantalla y pasan a ser sugerencias
  dentro de la conversación.
- **Tus conversaciones** — con quién hablas, qué tienes pendiente, qué
  servicios contrataste. Chats y Mis servicios son lo mismo.
- **Perfil** pasa a un avatar en la esquina, como en cualquier app.
- **Comunidad** desaparece de la barra. *(Ver la decisión de abajo.)*

**Una app que hace una cosa debe tener una pantalla principal.**

### C · Comunidad · ✅ **FUNDIDA CON LA FICHA** *(2026-08-16)*

Decidido y hecho. **Y resultó que fundir no era construir nada**: la ficha
de cada profesional **ya mostraba su obra**. Comunidad solo duplicaba lo
que ya existía, en un sitio donde nadie decide nada.

| | |
|---|---|
| la barra | **5 pestañas → 4** |
| lo único que Comunidad aportaba | el gesto de **publicar** |
| dónde vive ahora | en el perfil del profesional |

El profesional ve en su perfil: *"¿Has ayudado a alguien? Cuenta un caso que
hayas resuelto. Aparecerá en tu perfil, donde lo ven quienes están
decidiendo si escribirte."*

**La ruta `/feed` sigue existiendo** — se llega desde una publicación, no
desde una pestaña. Nada se borra; deja de ocupar un sitio que no merecía.

---

### C · La decisión, en su día

Comunidad son 8,4 pantallas, 91 acciones, y **el sitio donde los
profesionales publican su trabajo**. Es la pieza más grande que no sirve a
la tesis del producto.

Tres salidas, y la elección es del fundador:

1. **Retirarla.** Nüra queda enfocada. Se pierde la prueba social y el
   motivo por el que un profesional publica.
2. **Fundirla con la ficha.** Las publicaciones viven en el perfil de cada
   profesional, no en un muro. Se mantiene la prueba y desaparece la
   pestaña.
3. **Dejarla y aceptarla** como apuesta a futuro, sabiendo que hoy no
   ayuda a nadie a encontrar ayuda.

**Mi recomendación: la 2.** La prueba de que alguien trabaja bien tiene más
valor *dentro de su ficha*, cuando estás decidiendo si le escribes, que en
un muro que nadie visita.

### D · El aspecto, al final

Cuando la estructura esté decidida, **entonces** tiene sentido hablar de si
la app es agradable. Hoy no: pulir una estructura que sobra es lo que
llevamos horas haciendo.

Pero hay algo que sí es de fondo y no de píxeles: **Nüra es blanca y no
tiene identidad visual propia**. El morado aparece en botones sueltos y
poco más. Un producto que se llama como tu abuela y va de calidez humana
podría tener un color, una textura, algo que se reconozca.

Eso es una decisión de marca, no de CSS.

---

## El orden

1. **Decidir A** — qué dice Nüra que hace *(rápido, y cambia todo)*
2. **Decidir C** — qué pasa con Comunidad *(es la decisión grande)*
3. **Construir B** — la reestructuración a dos pestañas *(varias sesiones)*
4. **Entonces D** — identidad visual

**Nada de esto es refinamiento.** Son decisiones de producto, y hay que
tomarlas antes de escribir código.

---

## Lo que no se debe hacer

- **Seguir puliendo.** Ya está pulido y no ha servido.
- **Empezar por lo visual.** Es el paso 4, no el 1.
- **Construir B sin decidir C.** Reestructurar con una pestaña sin destino
  es rehacer el trabajo dos veces.
