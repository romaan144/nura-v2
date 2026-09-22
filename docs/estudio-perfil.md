# Nüra · Estudio del perfil

> Escrito el 2026-08-16. El fundador: *"el diseño del perfil en todas sus
> variantes debe mejorar mucho en todos los aspectos. Haz un estudio largo por
> etapas, en cuanto a diseño y funciones."*
>
> **Este estudio no parte de cero**: el plan anterior (`plan-perfil.md`, 6
> pasos) ya quitó el porcentaje, alineó la identidad, separó al profesional
> del usuario, cuadró las subpantallas, retiró las cifras inventadas y ordenó
> el final. Aquí se mira lo que **eso no tocó**: sobre todo, **lo que el
> perfil no deja hacer**.

---

## 1 · Las variantes, medidas

Se midieron las cinco en el navegador, con datos realistas.

| variante | alto | qué puede hacer |
|---|---|---|
| **sin cuenta** | 1,0 pantallas | crear cuenta · "quiero ser profesional" |
| **usuario nuevo** | 1,1 | editar nombre y teléfono · buscar · mis servicios · hacerse profesional · cerrar sesión |
| **usuario activo** | 1,0 | lo mismo + ver cuántas búsquedas y contactos · a quién sigue |
| **profesional nuevo** | 1,9 | editar nombre y teléfono · ver cómo le ven · publicar |
| **profesional activo** | 1,8 | **exactamente lo mismo que el nuevo** |

La última fila es el diagnóstico en una línea: **para un profesional, estar
activo no cambia nada en su perfil.** Ve lo mismo el primer día que el
centésimo.

---

## 2 · Lo que no funciona

Encontrado al medir. Son fallos, no opiniones.

### 2.1 · "Añade tu formación" no se puede tocar

El perfil del profesional le dice *"Añade tu formación · Es lo que más mira
quien duda"* — y **es un recuadro de texto, no un botón**. No lleva a ningún
sitio. Le pides algo y no le das forma de hacerlo.

### 2.2 · Un profesional no puede editar su ficha

Después del alta, **lo único editable es su cita personal**. No puede cambiar:

- su especialidad
- su formación
- su zona
- su precio
- lo que le diferencia
- si trabaja online

Si Marta sube la tarifa, cambia de barrio o termina un máster, **no hay
manera de reflejarlo**. Su ficha pública se queda como el día del alta.

### 2.3 · Marta puede escribirse a sí misma

En *"Así te ven quienes te necesitan"* aparece la vista previa de su ficha,
con su botón *"Escribir"*. **Es un botón real**: al tocarlo abre `/chat/me`,
un chat consigo misma.

Una vista previa tiene que parecer la ficha, no funcionar como ella.

### 2.4 · "Tu semana" siempre dice cero

El panel del profesional cuenta sus *"conversaciones abiertas"* leyendo
`contactedHelpers` — que son las conversaciones que **él ha empezado como
usuario**, no las que **le llegan como profesional**.

Resultado: con un mensaje sin leer de una clienta, *"Tu semana"* dice **"0
abiertas"**. En producción dirá cero siempre. Y además enseña los ceros al
profesional nuevo (*"0 abiertas · 0 citas · 0 publicaciones"*), que ya se
había prohibido en el paso 6 del plan anterior.

### 2.5 · Dos "Cerrar sesión"

Uno al final (correcto) y otro como icono arriba, que ahora mismo no ocupa
espacio visible pero sigue en el código. Si reaparece, cierra sesión **de
un toque, sin confirmar**, en la esquina donde se toca por accidente.

---

## 3 · Lo que no existe

### 3.1 · Borrar la cuenta — **obligatorio antes de lanzar**

No hay forma de borrar la cuenta ni los datos. El **RGPD** exige que
cualquier persona pueda pedir que se borren sus datos. Para un profesional,
además, su ficha es **pública**: tiene que poder retirarla.

Esto no es mejora de producto: **es un requisito legal para operar en
España**.

### 3.2 · La foto

El avatar se genera a partir del nombre. **No se puede subir una foto.** Y la
propia app le dice al profesional *"los perfiles con foto reciben más
mensajes"* — le pide algo imposible.

Para el usuario es opcional. **Para el profesional es la pieza de confianza
más importante de su ficha.**

### 3.3 · Ajustes

No hay ninguno. Faltan, por orden de importancia:

1. **Privacidad y términos** — enlaces a los textos legales *(requisito)*
2. **Borrar cuenta** *(requisito, ver 3.1)*
3. **Ayuda / contacto** — a quién escribir si algo va mal
4. **Avisos** — cómo quiere el profesional que le lleguen (móvil, correo)
5. **Pausar la ficha** — un profesional de vacaciones debe poder dejar de
   aparecer sin borrarse

### 3.4 · Lo que le llega al profesional

Nüra ya encola avisos cuando alguien escribe a un profesional, y el
profesional responde por `/r/:token`. Pero **en su perfil no ve nada de
eso**: ni quién le ha escrito, ni qué ha respondido, ni qué tiene pendiente.

Su perfil es un escaparate que no le dice si alguien ha mirado el
escaparate.

---

## 4 · La decisión que hay debajo de todo

**Nüra no tiene autenticación real.** Entrar es escribir un nombre y un
teléfono; se guardan en el móvil y ya está. No hay contraseña, ni código por
SMS, ni cuenta en el servidor.

Eso no importaba mientras el perfil solo mostraba cosas **del propio móvil**.
Pero casi todo lo que falta **toca datos del servidor**:

| función | por qué necesita saber quién eres |
|---|---|
| editar la ficha pública | si no, cualquiera podría editar la ficha de cualquiera |
| subir la foto pública | ídem |
| ver los avisos recibidos | son mensajes de clientes: privados |
| pausar o borrar la ficha | nadie puede retirar la ficha de otro |
| borrar la cuenta | hay que probar que la cuenta es tuya |

**Sin identificar al profesional, estas funciones no se pueden construir con
seguridad.** No es un detalle técnico: es la puerta a la mitad del estudio.

Hay tres caminos, y la elección es del fundador:

| | cómo | coste |
|---|---|---|
| **A · Enlace mágico** | como `/r/:token`: al profesional le llega un enlace a su móvil o correo que abre su panel | bajo — **ya existe la pieza** |
| **B · Código por SMS** | Supabase Auth con teléfono | medio — coste por SMS |
| **C · Correo y contraseña** | Supabase Auth clásico | medio — más fricción |

**Recomendación: A.** Es lo que ya funciona para responder avisos, no pide
contraseña a nadie y no cuesta dinero. El profesional tiene **un enlace
privado** a su panel, igual que ya tiene uno para cada aviso.

---

## 5 · Las etapas

Ordenadas para que **cada una se pueda hacer sin esperar a la siguiente**, y
las que dependen de la decisión del apartado 4 van al final.

### Etapa 1 · Lo roto ⬅ **EMPEZAR AQUÍ**

Sin decisiones pendientes. Solo arreglar lo que no funciona.

- *"Añade tu formación"* lleva a donde se añade
- La vista previa de su ficha **no funciona como ficha**: sin *"Escribir"*
- *"Tu semana"* sin ceros para el profesional nuevo, y sin contar mal
- Un solo *"Cerrar sesión"*, con confirmación

### Etapa 2 · El profesional edita su ficha *(en su móvil)*

Un editor con los mismos campos del alta. Mientras no haya autenticación,
**edita la copia de su móvil** — lo que él ve — y deja preparada la
escritura al servidor para la etapa 6.

Es media función, y hay que decirlo así: el profesional ve su cambio, pero
su ficha pública no cambia hasta la etapa 6.

### Etapa 3 · Ajustes, lo legal primero

- Privacidad y términos *(los textos los tiene que redactar alguien con
  criterio legal; aquí se ponen los enlaces y el sitio)*
- Ayuda y contacto
- **Borrar mis datos del móvil** — la parte del RGPD que sí se puede hacer
  sin servidor: todo lo que Nüra guarda en el teléfono, fuera

### Etapa 4 · El diseño del perfil de usuario

**¿Para qué abre alguien su perfil?** No para ver su nombre. Para
encontrar **lo que tiene a medias**: la cita del jueves, la conversación con
la logopeda, la persona que guardó.

El perfil de usuario pasa a ser eso: **lo que tienes pendiente**, arriba y
con nombre propio. La identidad, compacta. El teléfono, con formato
(*600 123 456*) — y preguntar si debe verse siquiera.

### Etapa 5 · El diseño del perfil de profesional

Dos partes claras, que hoy están mezcladas:

- **Tu ficha** — cómo te ven, y editarla
- **Tu trabajo** — lo que te llega, lo que tienes pendiente

La segunda solo puede estar vacía y ser honesta hasta la etapa 6: *"Cuando
alguien te escriba, lo verás aquí"* en lugar de ceros.

### Etapa 6 · Identidad del profesional *(requiere decisión del apartado 4)*

Con el camino elegido:

- la edición de la etapa 2 **llega a la ficha pública**
- el profesional **ve sus avisos** en *"Tu trabajo"*
- puede **pausar** su ficha
- puede **borrar** su cuenta y su ficha pública *(cierra el RGPD)*

### Etapa 7 · La foto *(requiere la etapa 6)*

Subida de foto al almacenamiento de Supabase, con recorte cuadrado en el
móvil. Solo se puede hacer con identidad: si no, cualquiera podría cambiar
la foto de cualquiera.

### Etapa 8 · Sin cuenta, y el repaso final

La página del perfil sin cuenta, y un repaso de las seis variantes a 360px
—el móvil estrecho— con el método que ha funcionado: **comparar la misma
cosa entre variantes**.

---

## 6 · Lo que el fundador tiene que hacer

| cuándo | qué |
|---|---|
| antes de la etapa 3 | decidir quién redacta privacidad y términos |
| antes de la etapa 6 | **elegir A, B o C** para identificar al profesional |
| antes de lanzar | tener el borrado de cuenta funcionando *(etapa 6)* |

---

## 7 · Cómo se trabaja

Una etapa por cada **"sigue"**. Para cada una: medir, arreglar, verificar
(build, lint, suite, smoke, rutas, recorrido, accesibilidad, 360px),
documentar y subir. Y si una etapa exige decidir algo de producto, se para y
se pregunta.

**Si se acaba el contexto**: leer este documento, ir a la etapa marcada como
**EMPEZAR AQUÍ** o **SIGUIENTE**, y arrancar.
