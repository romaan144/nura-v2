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

### 2.3 · Marta puede escribirse a sí misma — *corregido al implementar*

En *"Así te ven quienes te necesitan"* aparece la vista previa de su ficha,
con su botón *"Escribir"*. **El estudio exageraba**: la vista previa ya
llevaba `pointer-events: none`, así que **con el dedo no pasa nada** — mi
prueba pulsó el botón por código, que se salta esa protección.

Pero **con teclado o con VoiceOver** el botón sí se enfocaba y abría
`/chat/me`. Fallo menor, pero real.

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

### Etapa 1 · Lo roto ✅ *(2026-08-16)*

| | antes | ahora |
|---|---|---|
| *"Añade tu formación"* | recuadro que no se toca | se toca, abre un campo, guarda y **pasa a pedir lo siguiente** |
| *"una foto"* en la invitación | pedía algo imposible | fuera hasta la etapa 7 |
| vista previa de su ficha | enfocable con teclado/VoiceOver | `inert`: se mira, no se usa |
| *"Tu semana"* | contaba su actividad **como cliente**, y enseñaba ceros | solo sus publicaciones, sin ceros, frase honesta |
| botón *"Ver cómo te ven"* | **abría la ventana de publicar** | baja a la vista previa |
| *"Cerrar sesión"* | dos, uno de un toque en la esquina | uno, al final, con confirmación |

El de *"Ver cómo te ven"* era un fallo mío del plan anterior: cambié la
etiqueta del botón y no su acción.

La edición se guarda **en el móvil del profesional**; su ficha pública no
cambia hasta la etapa 6. Eso se dice en el código y aquí.

### Etapa 2 · El profesional edita su ficha ✅ *(2026-08-16)*

Nuevo `EditarFicha`: un botón **"Editar mi ficha"** bajo la vista previa abre
una hoja con **los mismos campos del alta** —especialidad, formación, dónde
trabaja, tarifa, qué le diferencia, dónde le avisamos— y cómo atiende
(presencial, online o las dos).

*"Guardar cambios"* solo se activa si algo cambió; *Cancelar* no guarda. La
vista previa se actualiza al momento. La hoja dice, en una línea: *"Por
ahora, estos cambios se guardan en tu móvil"* — la ficha pública espera a la
etapa 6.

### Dos fallos encontrados por el camino

**El ✓ de verificado era falso.** La vista previa ponía `verified: true` a
todo profesional, mientras su ficha pública real (la del alta) dice
`verified: false`. *"Así te ven"* le enseñaba una insignia que nadie más
ve. Ahora solo si está verificada de verdad.

**La barra flotante tapaba "Guardar cambios".** La hoja se pintaba dentro
de la pantalla del perfil, que crea su propia capa: ningún `z-index` sale de
ella, y la pestaña *"Perfil"* quedaba **encima** del botón. El toque caía en
la barra y no se guardaba nada. Medido con `elementFromPoint`. La hoja se
monta ahora en un *portal* al nivel del documento.

Verificado a 360px con toques reales.

### Etapa 3 · Ajustes, lo legal primero ✅ *(2026-08-16)*

Nuevo bloque **Ajustes** al final del perfil, antes de *Cerrar sesión*:

| fila | qué hace |
|---|---|
| **Privacidad** | abre `/legal/privacidad` |
| **Términos de uso** | abre `/legal/terminos` |
| **Ayuda y contacto** | solo aparece cuando exista `CONTACTO_EMAIL` |
| **Borrar mis datos de este móvil** | borra todo lo de Nüra en el teléfono, con confirmación |

### Los textos legales son un borrador, y lo dicen

Redactados a partir de **lo que la app hace de verdad**: qué guarda, dónde
(móvil o Supabase), para qué, los derechos del RGPD y la reclamación ante la
AEPD. Lo que no sé **queda entre corchetes y no se inventa**: nombre y NIF
del responsable, domicilio, correo de contacto, región de los servidores.

En pantalla: *"Versión provisional, pendiente de revisión legal."*

### Borrar mis datos

Borra **todas las claves que empiezan por `nura_`** (32 hoy) de este móvil y
recarga, para que ningún dato sobreviva en memoria. No toca nada de otras
apps. Verificado: la cuenta y las búsquedas desaparecen y se aterriza en la
bienvenida. Quedan listas vacías que la app recrea al arrancar — sin datos.

Al profesional se le avisa de que **su ficha pública no se borra desde
aquí** todavía: eso necesita la etapa 6.

### El rojo cuando es texto

*"Borrar mis datos"* en rojo daba **3,76**. Como con el morado: `--red` para
fondos, y `--red-ink` (`#B42318`, 6,6 sobre blanco) cuando es texto.

### Pendiente del fundador

- **El correo de contacto** → `CONTACTO_EMAIL` en `src/config.js`
- **Los datos del responsable** para el texto de privacidad
- **La revisión legal** de los dos textos antes de lanzar

### Etapa 4 · Diseño del perfil de usuario ✅ *(2026-08-16)*

**Nadie abre su perfil para ver cuántas veces buscó.** Lo abre para
encontrar la cita del jueves o la conversación con la logopeda.

| antes | ahora |
|---|---|
| *"2 búsquedas realizadas · 1 profesional contactado"* | **"Cita con Carlos · jueves 12 · 16:00 · Pendiente de confirmar"** |
| | **"Elena · «Mañana a las 9:30 en su domicilio…»"** con los mensajes sin leer |
| título *"Tu actividad"* | *"Lo tuyo"* |
| teléfono `600123456` | `600 123 456` (nuevo `fmtTel`) |

Hasta tres filas: primero las **citas** sin completar, luego las
**conversaciones**, las que tienen mensajes sin leer delante. Si alguien
tiene cita y conversación con la misma persona, sale una vez. Cada fila
lleva a donde se continúa.

Sin nada pendiente, **no se inventa nada**: van directos los enlaces a
*Mis servicios* y *Siguiendo*.

### Etapa 5 · Diseño del perfil de profesional ✅ *(2026-08-16)*

El perfil del profesional era **una tarjeta tras otra sin decir de qué iba
cada parte**: una invitación, un panel, el botón de publicar, la vista
previa, la cita. Ahora, bajo su nombre, dos secciones con título:

| sección | qué contiene |
|---|---|
| **Tu trabajo** | lo que le llega (*"Cuando alguien te escriba, te llegará un aviso…"*), sus publicaciones si las hay, y **Publicar un caso** |
| **Tu ficha** | lo que le falta (*"Añade tu formación"*), la vista previa, **Editar mi ficha** y su cita |

Después, igual que el usuario: *Tus cosas*, lo que viene, ajustes y cerrar
sesión.

**Publicar vive en "Tu trabajo"**: es la palanca que tiene para que le
encuentren. El segundo botón que había en la vista previa, fuera — un solo
gesto por acción.

*"Tu semana"* era una etiqueta pequeña dentro de la tarjeta; pasa a ser el
título *"Tu trabajo"*, fuera.

### El compás del perfil y los títulos

El perfil tiene una regla de ritmo —cada bloque de primer nivel lleva 20px
arriba y abajo y una línea fina encima—, hecha para que respire como la
ficha. Mis títulos nuevos eran bloques de primer nivel y la regla los trató
como **secciones sueltas**: línea propia, relleno propio, **81px** separados
de la tarjeta que titulan.

No se toca la regla. Se le enseña que **un título y lo que titula son una
sola sección**: `.tituloSeccion` conserva la línea de arriba y pierde el
relleno de abajo; lo siguiente pierde su línea. Hueco: **81 → 51px**.

### Etapa 6 · Identidad del profesional ✅ *(2026-08-16)*

**Decisión del fundador: correo y contraseña**, con *"restablecer
contraseña"* por correo si se olvida. Como casi todas las apps.

La etapa se divide en tres partes:

| | parte | estado |
|---|---|---|
| **6a** | **Las cuentas**: crear acceso, entrar, restablecer | ✅ hecha |
| **6b** | **La cuenta se une a su ficha pública, y lo que edita llega a ella** | ✅ hecha |
| **6c** | **Borrar la cuenta y la ficha pública (RGPD)** | ✅ hecha |

#### 6a · Las cuentas ✅ *(2026-08-16)*

- `src/utils/cuenta.js` — la librería **oficial** de Supabase, no llamadas a
  mano: sesiones, renovación de claves y enlaces de restablecer no se
  reinventan. Errores traducidos a lo que una persona puede hacer (*"El
  correo o la contraseña no son correctos"*). Contraseña de **8 caracteres**
  como mínimo.
- `/entrar` — entrar, crear acceso y *"¿Has olvidado tu contraseña?"* en una
  pantalla: son el mismo gesto.
- `/restablecer` — donde aterriza el enlace del correo. Sin enlace válido,
  lo explica y ofrece pedir otro: nunca un formulario que no puede
  funcionar.
- En **Tu ficha**: *"Crea tu acceso"* si no lo tiene; *"Tu acceso:
  marta@correo.es"* si lo tiene.
- La sesión se guarda como `nura_sesion`: **"Borrar mis datos" también la
  borra**, y *Cerrar sesión* también.

**Peso**: la librería son ~211 kB. Se cargan **solo al abrir Entrar o
Restablecer**; lo que descarga todo el mundo sigue en 788 kB (antes, 786).
El perfil lee la sesión directamente de `nura_sesion`, sin importar la
librería.

**Probado sin tocar la base de datos real**: las llamadas a Supabase se
interceptaron y se respondieron como el servidor — crear, entrar con
contraseña buena y mala, pedir el enlace, abrir restablecer sin enlace.

#### 6b · La ficha vinculada ✅ *(2026-08-16)*

**El problema de seguridad**: el móvil no guarda qué ficha es la suya. ¿Cómo
se une una cuenta a su ficha sin que nadie pueda quedarse con la de otra
persona?

**La prueba**: el correo de la cuenta, **confirmado**, coincide exactamente
con el contacto que puso en el alta. Sin la confirmación, cualquiera podría
crear una cuenta con el correo de otra y quedarse con su ficha.

- Operación nueva en el servidor, `reclamar-ficha`: comprueba sesión,
  confirmación y coincidencia exacta (no se fía del `ilike`, que trata `_`
  como comodín), y solo entonces escribe `owner_id`.
- El perfil vincula solo, al abrirse, y dice en qué punto está: *vinculada*,
  *confirma tu correo*, *no hay ficha con este correo*.
- **Editar mi ficha** escribe en la ficha pública con la sesión de la
  profesional. Si el servidor lo rechaza, la hoja no se cierra y lo explica.

**Dos protecciones en el SQL** (`docs/lanzamiento-cuentas.md`):

1. **Qué columnas puede cambiar**: especialidad, bio, zona, precio, online y
   contacto. **Nunca** verificada, nota ni valoraciones — si no, cualquiera
   podría ponerse un 5 con 999 opiniones.
2. **El contacto deja de poder leerse desde fuera.** Encontrado al construir
   esto: la app no *pedía* el contacto, pero la base de datos dejaba leerlo a
   cualquiera con la clave pública. Hoy no hay ningún contacto guardado, así
   que **no se ha filtrado nada** — pero el primer profesional real habría
   quedado expuesto.

Probado simulando el servidor: vincula, publica con su sesión y solo con las
columnas permitidas, y el rechazo se explica sin cerrar la hoja.

#### 6c · Borrar la cuenta ✅ *(2026-08-16)*

Con acceso, la fila de Ajustes pasa a llamarse **"Borrar mi cuenta"** y dice
exactamente qué se borra. Operación nueva en el servidor, `borrar-cuenta`,
que borra **por este orden**:

1. **Los avisos** que le llegaron — mensajes de clientes, datos de terceros
   que solo existen por su ficha.
2. **Su ficha pública** — buscada por `owner_id` = la cuenta de la sesión,
   **nunca por un id que mande el móvil**.
3. **Su cuenta.**

Después, todo lo del móvil. **Si el servidor falla, no se borra nada del
móvil**: tiene que poder volver a intentarlo con su sesión, y se le dice.

Probados los dos casos simulando el servidor.

Y un fallo mío de la etapa 3: el botón *"Borrar todo"* era **blanco sobre el
rojo claro (3,76)**. El medidor no lo vio porque solo aparece al desplegar.
Ahora sobre `--red-ink`.

**Con esto el RGPD queda cubierto en la app**: cualquiera puede borrar sus
datos, y una profesional, también su ficha pública. Falta que un abogado
revise los textos.

#### Lo que tiene que hacer el fundador en Supabase *(antes de probarlo de verdad)*

1. **Authentication → Providers → Email**: activado.
2. **Authentication → URL Configuration**:
   - *Site URL*: la dirección de la app en Vercel.
   - *Redirect URLs*: añadir `…/restablecer` y `…/profile`.
3. **Ejecutar el SQL y volver a desplegar la función**: ver
   `docs/lanzamiento-cuentas.md`.
4. **Antes de lanzar**: *Authentication → SMTP Settings* con el correo de
   Nüra. El envío por defecto de Supabase solo permite **unos pocos correos
   por hora**: vale para probar, no para lanzar.

---

### Etapa 6 · detalle original

---

### Etapa 5 · detalle original

---

### Etapa 4 · detalle original

---

### Etapa 3 · detalle original

---

### Etapa 2 · detalle original

---

### Etapa 1 · detalle original

Sin decisiones pendientes. Solo arreglar lo que no funciona.

- *"Añade tu formación"* lleva a donde se añade
- La vista previa de su ficha **no funciona como ficha**: sin *"Escribir"*
- *"Tu semana"* sin ceros para el profesional nuevo, y sin contar mal
- Un solo *"Cerrar sesión"*, con confirmación

### Etapa 2 · El profesional edita su ficha *(en su móvil)* — detalle

Un editor con los mismos campos del alta. Mientras no haya autenticación,
**edita la copia de su móvil** — lo que él ve — y deja preparada la
escritura al servidor para la etapa 6.

Es media función, y hay que decirlo así: el profesional ve su cambio, pero
su ficha pública no cambia hasta la etapa 6.

### Etapa 3 · Ajustes, lo legal primero — detalle

- Privacidad y términos *(los textos los tiene que redactar alguien con
  criterio legal; aquí se ponen los enlaces y el sitio)*
- Ayuda y contacto
- **Borrar mis datos del móvil** — la parte del RGPD que sí se puede hacer
  sin servidor: todo lo que Nüra guarda en el teléfono, fuera

### Etapa 4 · El diseño del perfil de usuario — detalle

**¿Para qué abre alguien su perfil?** No para ver su nombre. Para
encontrar **lo que tiene a medias**: la cita del jueves, la conversación con
la logopeda, la persona que guardó.

El perfil de usuario pasa a ser eso: **lo que tienes pendiente**, arriba y
con nombre propio. La identidad, compacta. El teléfono, con formato
(*600 123 456*) — y preguntar si debe verse siquiera.

### Etapa 5 · El diseño del perfil de profesional — detalle

Dos partes claras, que hoy están mezcladas:

- **Tu ficha** — cómo te ven, y editarla
- **Tu trabajo** — lo que te llega, lo que tienes pendiente

La segunda solo puede estar vacía y ser honesta hasta la etapa 6: *"Cuando
alguien te escriba, lo verás aquí"* en lugar de ceros.

### Etapa 6 · Identidad del profesional — detalle *(requiere decisión del apartado 4)*

Con el camino elegido:

- la edición de la etapa 2 **llega a la ficha pública**
- el profesional **ve sus avisos** en *"Tu trabajo"*
- puede **pausar** su ficha
- puede **borrar** su cuenta y su ficha pública *(cierra el RGPD)*

### Etapa 7 · La foto ✅ *(2026-08-16)*

La app le decía al profesional *"los perfiles con foto reciben más mensajes"*
y no había forma de subir una. Nuevo `FotoPerfil`, en **Tu ficha**, solo con
la ficha vinculada — sin saber quién es, cualquiera podría cambiar la foto
de cualquiera.

- **Se recorta y se reduce en el móvil** antes de subir: cuadrada, 480×480,
  JPEG. Una foto de cámara pesa 3-5 MB; con mala cobertura no subiría, y
  cada persona que mire la ficha la descargaría.
- **Ve cómo queda antes de guardarla**: *"Así se verá en tu ficha"*, con
  *Elegir otra* o *Usar esta foto*.
- Se guarda en `fotos/<su cuenta>/perfil.jpg`; **el almacenamiento solo le
  deja escribir en su carpeta**. La ficha pública apunta a ella
  (`avatarUrl`, la columna que la app ya leía), con `?v=` para que nadie
  siga viendo la anterior.
- Sale en la cabecera de su perfil y en la vista previa de su ficha.
- *Borrar mi cuenta* borra también la foto.

Probado con una foto de 2400×1600: llega a la vista previa como 480×480, se
sube a su carpeta y la ficha la usa. SQL en `docs/lanzamiento-cuentas.md`
(apartado 1b): la columna, la carpeta —pública para mirar, 1 MB y solo
JPEG— y los permisos por carpeta.

### Etapa 8 · Sin cuenta, y el repaso final ✅ *(2026-08-16)*

#### Lo grave: no había forma de entrar

La página sin cuenta ofrecía *"Crear cuenta gratis"* y *"Quiero ser
profesional"*, pero **ningún "ya tengo acceso"**. La cuenta de la etapa 6 no
se podía usar desde un móvil nuevo. Y aunque se encontrara la pantalla de
entrar, el móvil no sabría quién era ni cuál era su ficha.

- *"¿Ya tienes acceso de profesional? Entra"* en la página sin cuenta.
- Al entrar desde un móvil sin nada guardado, el servidor devuelve **su
  ficha entera** y el móvil **reconstruye a la profesional**: nombre,
  especialidad, zona, precio y ficha vinculada. Probado simulando el
  servidor.

#### Lo menor

- *"Quiero ser **P**rofesional"* → *"profesional"*.
- El sello de versión llevaba `opacity: 0.6`, que aclara el texto por encima
  de su color. **Otro punto ciego del medidor**: miraba el color, no la
  opacidad del elemento. Corregido el sello, y el medidor ahora multiplica
  la opacidad de cada elemento y sus padres.

#### El repaso, a 360px

| variante | alto | secciones | desborde |
|---|---|---|---|
| sin cuenta | 1,1 | Crea tu cuenta | no |
| usuario nuevo | 1,6 | nombre · Ajustes | no |
| usuario activo | 1,5 | nombre · lo tuyo · Ajustes | no |
| profesional nueva | 2,7 | nombre · Tu trabajo · Tu ficha · Ajustes | no |
| profesional vinculada | 2,7 | nombre · Tu trabajo · Tu ficha · Ajustes | no |

**Es más largo que al empezar** (a igual pantalla: usuario 1,1 → 1,4;
profesional 1,9 → 2,4). No es relleno: son funciones que no existían
—ajustes, acceso, foto, editar la ficha—, y lo más largo va al final.

---

# 🏁 ESTUDIO DEL PERFIL · COMPLETO

| | etapa | |
|---|---|---|
| 1 | Lo roto | ✅ |
| 2 | El profesional edita su ficha | ✅ |
| 3 | Ajustes, lo legal primero | ✅ |
| 4 | El perfil de usuario: lo que tienes a medias | ✅ |
| 5 | El perfil de profesional: tu trabajo y tu ficha | ✅ |
| 6 | Cuentas, ficha vinculada y borrado (RGPD) | ✅ |
| 7 | La foto | ✅ |
| 8 | Sin cuenta, y repaso | ✅ |

**Fallos encontrados sin buscarlos**: el ✓ de verificado falso en su propia
vista previa, la barra tapando *"Guardar cambios"*, el contacto legible
desde fuera de la app, dos fallos de contraste que el medidor no veía
(opacidad, botón oculto) y que no se podía entrar desde un móvil nuevo.

**Pendiente del fundador** para que funcione en producción:

1. Supabase → **SQL** de `docs/lanzamiento-cuentas.md` (apartados 1 y 1b).
2. Supabase → **volver a desplegar** la función `helpers-write`.
3. **Correo de Nüra** → `CONTACTO_EMAIL` y el SMTP de Supabase.
4. **Revisión legal** de privacidad y términos.

---

### Etapa 8 · detalle original

---

### Etapa 7 · detalle original

Subida de foto al almacenamiento de Supabase, con recorte cuadrado en el
móvil. Solo se puede hacer con identidad: si no, cualquiera podría cambiar
la foto de cualquiera.

### Etapa 8 · detalle del plan

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
