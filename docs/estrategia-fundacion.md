# Nüra · Documento de fundación estratégica

*Escrito desde el asiento del cofundador, no desde el del consultor. Con el
contexto de haber estado dentro del código, no solo del pitch.*

---

## 0 · La decisión que va antes que todas: Teresa o Nüra

Tienes un producto construido que se llama Nüra, con marca, isotipo y
dominio. Y tienes un nombre nuevo, Teresa, que viene de tu abuela.

**Mi recomendación: quédate con Nüra como empresa y producto, y usa a
Teresa donde de verdad vale — en el origen y, si acaso, como la voz.**

El argumento no es de coste de cambio. Es de tesis.

Tu frase es *"la IA no reemplaza humanos, conecta humanos"*. Si el producto
lleva nombre de persona, **la IA se convierte en la protagonista**. Teresa
pasa a ser "con quien hablas", y los profesionales quedan de fondo. Es
exactamente el error de posicionamiento que tu propia tesis dice evitar.
Nüra es más neutra: es *el sitio donde te encuentras con alguien*, y deja
que los humanos sean los héroes de la historia.

Además, un nombre propio femenino en una app de asistencia arrastra una
asociación que no te conviene: Siri, Alexa, Cortana. Todas asistentes.
Todas sustitutas de la interacción humana. Es la categoría de la que
quieres salir.

**Lo que sí debes hacer con Teresa**, porque es un activo de marca real:

- **Es tu mito fundacional.** "Mi abuela Teresa ayudaba a medio barrio y
  nadie tenía un papel que lo dijera." Esa frase abre una ronda, una nota
  de prensa y una entrevista. Úsala en cada una.
- **Es el nombre del principio interno.** "El test Teresa": ¿mi abuela
  habría aparecido en esta búsqueda? Si tu sistema solo encuentra a gente
  con título, has fallado. Ponlo en la pared.
- **Opción intermedia si te duele soltarlo**: Nüra es la plataforma,
  Teresa es la voz que te escribe. Es elegante, pero **te obliga a
  construir dos marcas con el presupuesto de media**. Solo si tienes
  claridad de sobra.

Si aun así eliges Teresa como marca única, que sea una decisión tomada, no
una nostalgia arrastrada — y entonces hazlo ya, antes de gastar un euro más
en Nüra.

---

## 1 · El diagnóstico honesto: dónde estás de verdad

Me pediste que cuestione. Esto es lo que veo tras estar dentro del código.

**Tienes un producto muy por delante de tu validación.**

La app tiene feed, comunidad, publicaciones tipadas, seguimiento,
comentarios, chat, agenda con disponibilidad por oficio, panel del
profesional y carta de presentación generada. Es mucho más de lo que
necesita un MVP.

Y en paralelo, hasta esta semana:

- **Ningún profesional dado de alta desde la app podía aparecer en una
  búsqueda.** Un `await` que faltaba dejaba su categoría vacía. El lado de
  la oferta estaba roto de raíz y nadie lo notó — porque no hay oferta real
  que lo notara.
- **Toda la actividad que se ve es sembrada.** Chats, citas, seguidos,
  historias del feed. Nada de eso ocurrió.
- **Una categoría entera —logopedia— tiene dos profesionales.** Toda
  recomendación ahí es teatro: no hay entre quién elegir.

Esto no es una crítica al trabajo. El producto está bien hecho. Es un
diagnóstico de **fase**: has construido la versión 3 de un producto cuya
versión 0 no se ha probado con nadie.

**La consecuencia estratégica**: no sabes todavía si alguien en Barcelona
prefiere contarle su problema a una IA en vez de preguntar en el grupo de
WhatsApp del barrio. Esa es la única pregunta que importa ahora, y no la
responde ninguna línea de código más.

---

## 2 · La tesis, y por qué puede ser defendible

Hay tres formas de contar lo que haces. Solo una es un negocio defendible.

1. **"Un marketplace de servicios locales con IA."** Muerto al nacer.
   Compites con Cronoshare, Habitissimo y el grupo de WhatsApp del edificio.
   La IA es una feature, no un foso.
2. **"Un asistente que te encuentra profesionales."** Mejor UX, foso nulo.
   Cualquiera con una API lo replica en un fin de semana.
3. **"El registro de quién ayuda de verdad."** Aquí sí hay algo.

La tercera es la buena, y creo que es la que ya intuyes cuando hablas de
*currículums vivos basados en ayudas reales*.

**El argumento**: el mundo mide capacidad con títulos y con estrellas. Los
títulos no dicen si sabes tratar a un niño de cinco años que no pronuncia
la R. Las estrellas son un número sin memoria — un 4,9 no te dice *qué*
resolvió esa persona. Entre ambos hay un hueco enorme: **nadie tiene el
registro de qué problema concreto resolvió qué persona concreta, y con qué
resultado.**

Ese registro:

- **No se puede comprar.** Solo se acumula transacción a transacción.
- **No se lo lleva la competencia**, porque es de tus usuarios y de tus
  profesionales a la vez.
- **Vale fuera de tu app.** Un currículum de ayudas demostradas es
  empleabilidad. Ahí está tu expansión a contratación laboral, que ya
  mencionas.
- **Es la única versión de esto que puede encontrar a tu abuela Teresa**,
  que no tenía título.

Todo lo demás —el chat, el matching, el feed— son el mecanismo para que ese
registro se llene. Son medios. **El grafo de resultados es el producto.**

Estratégicamente, esto significa una cosa incómoda: **La Obra (las
publicaciones con resultado) importa más que el matching.** Y hoy está
tratada como una feature secundaria.

---

## 3 · El MVP real

El MVP no es la app que tienes. Es esto:

> **Un barrio. Dos categorías. Treinta profesionales verificados a mano.
> Y tú leyendo cada petición durante los primeros dos meses.**

Concretamente:

- **Zona**: un distrito de Barcelona, no la ciudad. Gràcia o l'Eixample.
  La densidad importa más que el tamaño: alguien tiene que estar a quince
  minutos.
- **Categorías**: dos, con demanda dolorosa y recurrente. Mi apuesta:
  **cuidado de mayores** y **apoyo escolar/logopedia infantil**. Ambas son
  decisiones cargadas de emoción, con búsqueda difícil y confianza como
  factor número uno. Es donde una recomendación razonada gana a un listado.
  Evita "reparaciones del hogar" al principio: es urgente, transaccional y
  el precio manda. Ahí pierdes contra el fontanero del barrio.
- **Oferta**: 30 personas reclutadas a mano, entrevistadas por ti,
  verificadas por ti. No hay alta automática todavía. La calidad de los
  primeros treinta define el producto durante dos años.
- **Matching**: **tú**, leyendo. Las primeras 200 peticiones las emparejas
  a mano. Con la IA delante para ayudarte, pero decides tú.
- **Interfaz**: puede ser WhatsApp. En serio.

**Por qué el conserje manual y no la app que ya tienes:**

Cada emparejamiento que haces a mano te enseña algo que ningún dato te
daría: qué preguntan de verdad, con qué palabras, qué les da miedo, qué les
hace decir que sí. Eso es el corpus con el que después entrenas y afinas.
Automatizar antes de entender es automatizar tu ignorancia.

Y hay un motivo de negocio más duro: **si no consigues que treinta
personas queden contentas con un emparejamiento hecho a mano, la app no lo
va a arreglar.** Y si lo consigues, ya tienes un negocio y solo te falta
escalarlo.

**El criterio de graduación del MVP** — cuándo dejar de hacerlo a mano:

- 100 conexiones completadas con resultado registrado.
- 40% de los usuarios vuelven a pedir algo en 90 días.
- Puedes predecir a quién recomendarías antes de mirar la lista, en 8 de
  cada 10 casos. *Eso significa que el criterio está listo para codificarse.*

---

## 4 · Arquitectura conceptual del producto

Cuatro objetos. Todo lo demás es interfaz.

| objeto | qué es | por qué existe |
|---|---|---|
| **Necesidad** | lo que alguien cuenta, en sus palabras | es el dato crudo del que sale todo |
| **Persona** | un humano con capacidades demostradas | el activo que se aprecia |
| **Encuentro** | necesidad + persona + qué pasó | **la unidad de valor real** |
| **Resultado** | el desenlace, contado por quien lo vivió | lo que convierte un encuentro en reputación |

**La regla arquitectónica que te salva de convertirte en un directorio**:
un Encuentro sin Resultado está incompleto y el sistema debe perseguirlo
activamente. La app hoy tiene el concepto (el campo "resultado" obligatorio
en las publicaciones de obra) pero no persigue el cierre. Ese lazo —pedir
el resultado, capturarlo, atribuirlo— es la maquinaria que llena tu foso.
Si solo construyes una cosa más este trimestre, que sea el cierre del lazo.

**Lo que NO debe existir en la arquitectura**: un perfil que se edita a sí
mismo. En cuanto el profesional escribe su propio currículum, vuelves a
LinkedIn: declaraciones sin verificar. Su perfil debe ser **mayormente
derivado** de sus encuentros. Que pueda añadir contexto, no reclamar
capacidad.

---

## 5 · Comportamiento de la IA

Tu documento pide que la IA construya perfiles vivos, aprenda
continuamente, detecte capacidades reales, distinga aficionados de
profesionales, analice reputación y descubra talento fuera de los títulos.

**Honestamente: nada de eso al principio, y algo de eso nunca.**

Lo que la IA debe hacer bien desde el día uno, por orden:

1. **Escuchar y encuadrar.** Entender qué necesita alguien que escribe
   mal, con prisa y con miedo. Esto ya funciona razonablemente.
2. **Escribir la presentación en sus palabras.** Que el profesional reciba
   el problema contado como lo contó la persona, no un formulario. Esto ya
   lo tienes (`buildChatOpener`) y es de lo mejor del producto: **elimina
   la barrera del primer mensaje**, que es donde se cae la mitad de los
   contactos en cualquier marketplace.
3. **Decir la verdad cuando no sabe.** Ya está construido (Los Dos
   Silencios) y es más valioso de lo que parece: el momento en que una IA
   admite que no tiene a nadie es el momento en que te crees el resto.
4. **Estructurar el resultado después.** Convertir *"pues muy bien, en
   cuatro meses ya decía la erre"* en un registro comparable. **Esta es la
   función más infravalorada de tu IA y la que construye el activo.**

Lo que debe hacer **más adelante**, cuando haya datos:

5. Detectar patrones de encaje que tú no ves (esta cuidadora funciona
   especialmente bien con familias que viven lejos y sienten culpa).
6. Descubrir capacidad no declarada leyendo resultados acumulados.

Lo que **no debe hacer nunca**: juzgar a una persona por inferencia y
ocultárselo. Si el sistema decide que alguien es "amateur", esa persona
tiene derecho a saberlo y a rebatirlo. Una plataforma de reputación que
puntúa en secreto acaba en un escándalo, y con tu posicionamiento de
confianza sería letal.

**Un principio de diseño para la IA**: *la IA nunca es la que ayuda. Es la
que presenta.* En cuanto Nüra empiece a dar consejos de logopedia en vez de
encontrarte una logopeda, has traicionado la tesis y además has asumido una
responsabilidad legal que no quieres.

---

## 6 · Matching inteligente

Tres capas, en este orden de importancia:

**Capa 1 — Compatibilidad dura (la que ya tienes).** Categoría, zona,
disponibilidad real. Es un filtro binario y no debe negociarse: ninguna
puntuación puede colar a alguien incompatible. Tu código ya lo hace bien
("La Puerta") y es una decisión correcta.

**Capa 2 — Encaje humano (la que te diferencia).** No es "mejor valorado".
Es: *esta familia está asustada y quiere a alguien que explique despacio*.
Estas señales salen de las palabras de la petición, no de los filtros.
Es la capa donde ganas y donde hoy tienes poco.

**Capa 3 — Evidencia (la que construye el foso).** ¿Ha resuelto esta
persona un caso *como este*? Aquí es donde `obraSignal` —que ya existe— se
vuelve la señal más importante del sistema, no un bonus de +6.

**Una crítica concreta a lo que hay hoy**: el ranking da +80 a los perfiles
de demo, que tienen la mitad de datos que los escritos a mano, y +40 a
acertar la categoría. Es decir, **pesa el doble ser un perfil de relleno
que ser del oficio correcto**. Cuando entre oferta real, esa constante hay
que borrarla.

**Y la decisión de producto más importante del matching**: cuántos enseñas.
Hoy enseñas uno destacado y hasta tres alternativas. **Yo enseñaría uno.**
Un marketplace que te da una lista te devuelve el trabajo de elegir —
exactamente lo que la persona quería delegar. Una recomendación con un
porqué es un producto distinto y mejor. La lista es el plan B, escondido
tras "si prefieres comparar".

---

## 7 · Reputación: el sistema que decide si esto vale algo

**Lo que no debes hacer: estrellas.** Un 4,9 no dice nada, se infla siempre
y no distingue a quien resolvió tu problema exacto de quien fue amable.

**Lo que debes construir**: reputación como **conjunto de resultados
verificados**, cada uno atado a una necesidad real.

```
Carlos Martínez · logopeda
  · Niño de 5 años, dislalia. En 4 meses pronunciaba la R.   [verificado]
  · Niña de 7, tartamudez leve. Mejoró la fluidez en un curso. [verificado]
  · 12 casos infantiles · 0 abandonos
```

Eso es infinitamente más útil que "4,9★ (127)". Y es lo que hace posible
encontrar a tu abuela: Teresa no tiene título, pero tiene once vecinos que
pueden contar qué hizo por ellos.

**Reglas de diseño del sistema de reputación:**

1. **Solo cuenta lo verificado.** Un resultado necesita a las dos partes: el
   encuentro existió en la plataforma y el usuario lo confirmó.
2. **El silencio también informa.** Un encuentro que nunca se cierra es una
   señal. No lo castigues públicamente, pero úsalo.
3. **Es asimétrico a propósito.** El usuario valora al profesional. El
   profesional no valora al usuario. Las valoraciones cruzadas generan
   reciprocidad falsa (Airbnb tardó años en admitirlo).
4. **Debe poder envejecer.** Alguien que fue excelente hace seis años y
   lleva dos sin aparecer no es lo mismo. Peso decreciente en el tiempo.
5. **El profesional es dueño de su registro.** Debe poder exportarlo. Sí,
   facilita que se vaya. También es lo que hace que confíe lo bastante como
   para construirlo contigo. Y quien se lo lleva sigue necesitando que tú
   lo sigas emitiendo.

---

## 8 · UX / UI: las leyes que ya tienes y las que faltan

Tu sistema de diseño ya es bueno y tiene principios reales (El Contrato de
Layout, La Gramática de la Recomendación, diseñar sistemas y no pantallas).
No los repito. Añado lo que aprendí rompiéndolo:

**Ley 1 · Todo camino tiene vuelta.** El fallo más repetido de la app eran
caminos de ida: un filtro que no se podía deshacer, una corrección que
secuestraba la siguiente pregunta, una búsqueda que no se cancelaba. En un
producto conversacional esto duele el doble, porque la conversación
promete reversibilidad.

**Ley 2 · Lo que existe dos veces diverge.** Dos hojas de reserva, dos
puertas de cuenta, dos pantallas de favoritos, dos medidores. En todos los
casos una se arregló y la otra se quedó atrás en silencio. Antes de crear
una segunda implementación de algo, la respuesta correcta casi siempre es
extraer la primera.

**Ley 3 · Un estado vacío que nadie ve, se pudre.** El estado vacío de
"Siguiendo" tenía el texto roto porque los datos de demo lo tapaban. Los
estados vacíos son los que ve tu usuario más valioso: el nuevo.

**Ley 4 · La honestidad es una función de producto.** Decir "no trabaja ese
día" en vez de "lo tiene completo" no es copywriting, es información con la
que la persona decide. Cada mentira pequeña por comodidad de implementación
es una retirada de tu única cuenta bancaria: la confianza.

---

## 9 · Branding y storytelling

**El error a evitar**: contar la historia de la tecnología. "IA que
entiende lenguaje natural" no le importa a nadie que necesita una cuidadora
para su madre.

**La historia que sí funciona**, en tres movimientos:

1. **El problema es humano y universal**: cuando necesitas ayuda de
   verdad, no sabes a quién llamar. Y la gente que podría ayudarte está a
   tres calles y no tiene forma de que la encuentres.
2. **El villano no es la gente, es el sistema de señales**: los títulos no
   capturan la capacidad y las estrellas no capturan la historia. Por eso
   nadie encuentra a la persona adecuada.
3. **La promesa**: no te damos una lista. Te decimos quién y por qué.

**Tu abuela es el primer movimiento hecho persona.** Una mujer que ayudó a
medio barrio durante cuarenta años y de la que no queda registro. Eso es
tu diapositiva 1, tu about, y tu respuesta cuando te pregunten por qué
haces esto.

**Tono**: cálido pero no blando. El riesgo de una marca de cuidado es
volverse ñoña y perder credibilidad. La forma de evitarlo es la
**concreción**: no "cuidamos de los tuyos", sino "Elena lleva ocho años
con enfermos de alzhéimer y esta semana tiene los martes libres".

**Sobre el isotipo actual** (los tres lóbulos que dejan un corazón en el
hueco): la idea es buena — tres personas que al juntarse crean el afecto en
el espacio negativo. Es exactamente tu tesis. Dos cuidados: el degradado
rico funciona en la app y mal en un sello de un centímetro o en negro
sobre blanco. Necesitas una versión monocroma de una sola tinta que
mantenga el corazón legible. Y verifica que el corazón se sigue leyendo a
16px de favicon; si no, el activo no es el logo, es la forma.

---

## 10 · Validación de mercado

**Lo que tienes que probar, en orden estricto.** No pases al siguiente sin
cerrar el anterior.

**H1 · Hay dolor de búsqueda.** *La gente no encuentra a quien necesita, y
le cuesta.* Método: 40 entrevistas en el barrio, cero pitch. Solo: "la
última vez que necesitaste ayuda con X, ¿cómo lo resolviste?" Señal de
validación: cuentan una historia larga y frustrante sin que preguntes.

**H2 · Prefieren contar el problema a buscar en una lista.** Método:
concierge por WhatsApp. Que escriban. Señal: escriben más de dos frases y
vuelven una segunda vez.

**H3 · La recomendación razonada convierte mejor que la lista.** Método:
A/B a mano. A unos les mandas tres opciones, a otros una con su porqué.
Señal: el ratio de "escribo a esta persona" es materialmente mayor con una.
**Si esto no se cumple, tu producto entero es una preferencia estética y
no una ventaja.**

**H4 · Los profesionales quieren el registro.** Método: enséñales un
currículum vivo de mentira, hecho a mano, con sus casos. Señal: preguntan
cómo consiguen más casos ahí. Si les da igual, tu foso no existe y esto es
un directorio.

**H5 · Vuelven.** El único número que importa a los doce meses.

**Anti-señal a vigilar**: que todo el mundo diga que le encanta la idea y
nadie escriba nunca. Es la muerte más común y la más halagadora.

---

## 11 · Crecimiento y viralidad

**Los servicios locales no son virales. Son hiperlocales, que es distinto y
mejor si lo entiendes.**

Nadie comparte una app de fontaneros. Pero **todo el mundo cuenta a quién
le funcionó**. El objeto que viaja no es tu producto: es el nombre de una
persona con una historia pegada.

**El bucle que hay que construir:**

```
alguien recibe ayuda → se le pide el resultado en una frase
   → esa frase se convierte en una tarjeta con el nombre del profesional
      → el profesional la comparte (le construye su reputación)
         → sus contactos ven una prueba concreta, no un anuncio
            → entran buscando a esa persona → descubren el resto
```

Fíjate en quién comparte: **el profesional, no el usuario**. El usuario no
tiene incentivo para anunciar que contrató una cuidadora. El profesional sí
tiene un incentivo enorme para enseñar una prueba de su trabajo. **Tu
mejor canal de adquisición es tu propia oferta compartiendo su reputación.**
Y eso solo funciona si el resultado que le das es lo bastante bueno como
para que quiera enseñarlo. Así que la calidad del artefacto de resultado
*es* tu estrategia de crecimiento.

**Canales por fase:**

- **Fase 0**: tú, a pie de barrio. AMPAs, centros cívicos, farmacias,
  grupos de vecinos. Nada escala y da igual.
- **Fase 1**: el bucle de arriba, con los profesionales como distribuidores.
- **Fase 2**: SEO de resultados. Cada encuentro cerrado es una página
  única: *"logopeda para dislalia infantil en Gràcia"* con un caso real
  detrás. Esto es defendible porque nadie más tiene los casos.
- **Fase 3**: prescriptores institucionales. Pediatras, colegios,
  trabajadores sociales, residencias. Es lento, es aburrido y es el canal
  más sólido en cuidados.

**Lo que no funcionará**: pagar por instalaciones. Un marketplace con
liquidez baja convierte el dinero en usuarios frustrados.

---

## 12 · Monetización

**Lo que no debes hacer al principio: cobrar comisión por transacción.**

Todo el mundo lo intenta y en servicios locales recurrentes casi todo el
mundo pierde. La razón es estructural: en cuanto el usuario y el
profesional se conocen, la segunda cita ocurre por WhatsApp. Perseguir esa
fuga te obliga a esconder los teléfonos, meter fricción y castigar a tus
mejores usuarios — **destruyes exactamente el posicionamiento de confianza
que es tu ventaja**. Acabas siendo la app que se interpone entre dos
personas que quieren hablar. Justo lo contrario de tu tesis.

**Lo que sí:**

1. **Suscripción del profesional (el motor).** No pagan por leads: pagan
   por **el activo que no se pueden llevar** — su currículum vivo, su
   visibilidad, sus casos verificados. Precio ancla: 19–39 €/mes. La
   conversación de venta es "esto es lo que demuestra lo que sabes hacer",
   no "esto te trae clientes". La primera es defendible, la segunda te
   pone a competir con Google Ads.
2. **Verificación como servicio de pago.** Comprobación de identidad,
   titulación y antecedentes. Coste real, valor evidente, y sube el listón
   de calidad. Además es el ingreso que mejor se alinea con tu misión.
3. **Después, y solo después: contratación.** Cuando el grafo de
   resultados tenga volumen, una residencia, un colegio o una familia con
   necesidad continuada pagará por acceso a talento verificado. Esa es la
   monetización grande y llega en el año tres, no en el uno.

**Lo que nunca**: vender los datos de las conversaciones. No solo por
ética — es que tu producto *es* la confianza. Venderla es liquidar el
activo para pagar la nómina.

**Una nota de urgencia**: hoy el cliente puede leerse las conversaciones de
otros usuarios porque la consulta pide todas las columnas. Está anotado en
el preflight. Un incidente de privacidad en el año 1 de una marca de
confianza no se supera.

---

## 13 · Cómo muere esto (y cómo evitarlo)

Los cinco finales más probables, por probabilidad:

**1 · Muerte por densidad (la más probable).** Alguien busca, no hay nadie
bueno cerca, no vuelve. Y sin usuarios no puedes reclutar profesionales.
*Antídoto*: un barrio, dos categorías, oferta reclutada a mano antes de
abrir la demanda. La densidad se compra con foco, no con dinero.

**2 · Muerte por desintermediación.** Funciona, se conocen, se van, tú te
quedas con el coste de adquisición. *Antídoto*: no vivas de la transacción.
Vive del activo que solo existe dentro (§12).

**3 · Muerte por producto sin usuarios.** Sigues construyendo features
porque construir es más agradable que vender. **Este es tu riesgo personal
específico y ya hay evidencia de él**: seis meses de producto excelente sin
un solo profesional real. *Antídoto*: una métrica en la pared —conexiones
reales completadas esta semana— y la regla de no escribir código dos
semanas seguidas sin haber hablado con un usuario.

**4 · Muerte por incidente de confianza.** Un mal profesional, un daño real,
una noticia. En cuidado de mayores y menores esto es existencial.
*Antídoto*: verificación real desde el día uno —no un checkbox—, seguro, y
un protocolo escrito antes de necesitarlo.

**5 · Muerte por commodity.** Google o WhatsApp añaden esto. *Antídoto*: el
grafo de resultados. Es lo único que no pueden copiar en un trimestre.

---

## 14 · Roadmap

**Trimestre 1 — Probar que a alguien le importa**
Concierge manual, WhatsApp, un barrio, dos categorías, 30 profesionales
reclutados a mano. Objetivo: **100 conexiones completadas con resultado
registrado.** Producto a construir: casi ninguno.

**Trimestre 2 — Cerrar el lazo**
Llevar el concierge a la app que ya tienes, pero con una obsesión única:
que cada encuentro termine en un resultado capturado. La primera versión
del currículum vivo. Alta profesional abierta solo por invitación.
Objetivo: **50% de los encuentros con resultado registrado.**

**Trimestre 3 — Que la oferta te traiga demanda**
El artefacto de resultado compartible. Suscripción profesional en beta con
los primeros treinta. Segunda categoría adyacente. Objetivo: **30% de las
altas nuevas vienen de un profesional.**

**Trimestre 4 — Empezar a escalar**
Segundo barrio, con el manual escrito del primero. Verificación de pago.
Primeros prescriptores institucionales. Objetivo: **retención a 90 días por
encima del 40%** y una unidad económica que aguante mirarla.

**Año 2** — Barcelona entera, matching automático entrenado con las 2.000
decisiones que tomaste a mano, y el currículum vivo como producto propio.

**Año 3** — Contratación: el grafo de resultados vendido como acceso a
talento verificado.

---

## 15 · Pitch para inversores

**La estructura, en diez diapositivas:**

1. **Teresa.** Tu abuela, cuarenta años ayudando, ningún registro.
2. **El problema no es encontrar servicios. Es que la capacidad real no
   está registrada en ningún sitio.** Títulos y estrellas, y un hueco
   enorme en medio.
3. **Por qué ahora.** Por primera vez una máquina entiende un problema
   contado en lenguaje natural y desordenado. Antes esto exigía un humano
   por conversación.
4. **Qué hacemos.** Cuentas tu problema. Te decimos quién y por qué. Con
   una demo real, no un mockup.
5. **Lo que construimos de verdad.** El grafo de resultados: quién resolvió
   qué, verificado. *Esta es la diapositiva de la que depende la ronda.*
6. **Tracción.** Conexiones completadas, resultados capturados, retención.
   Números pequeños y reales; nunca usuarios registrados.
7. **Negocio.** Suscripción del profesional. Por qué no comisión —
   demuestra que entiendes tu categoría mejor que ellos.
8. **Mercado.** De abajo arriba: hogares en Barcelona × frecuencia ×
   ticket. Los TAM de arriba abajo te restan credibilidad.
9. **Por qué no os copian.** Densidad local + grafo de resultados. Ambos se
   acumulan, ninguno se compra.
10. **Equipo y petición.** Cuánto, para qué hito concreto.

**La pregunta que te van a hacer y para la que necesitas una respuesta
sólida**: *"¿por qué no se van por WhatsApp después del primer contacto?"*
La respuesta buena no es "los retenemos". Es: **"se van, y no pasa nada,
porque no cobramos la transacción. Cobramos el registro, que solo existe
aquí."** Si tu modelo no aguanta esa respuesta, cambia el modelo.

**Lo que no debes hacer en el pitch**: llamarlo "IA que…". En 2026 eso
resta. La IA es la interfaz; el activo es el registro.

---

## 16 · Visión a diez años

Si esto sale, en diez años Nüra no es un marketplace. Es **la
infraestructura de capacidad demostrada**.

- Un currículum que no dice dónde estudiaste, sino a quién ayudaste y qué
  pasó, con las dos partes confirmándolo.
- Un sistema donde una mujer de sesenta años sin título puede probar que
  sabe cuidar mejor que la mitad de los titulados — porque hay ochenta
  familias que lo confirman.
- Y un cambio de pregunta en el mercado laboral: de *"qué tienes"* a
  *"qué has resuelto"*.

**El test para saber si sigues en el camino correcto**, y quiero que sea
literalmente este:

> ¿Habría aparecido Teresa en una búsqueda de Nüra?

Si la respuesta es no —porque no tiene título, porque no sabe hacerse un
perfil, porque no está en internet— entonces has construido otro directorio
y le has puesto el nombre de tu abuela. Y eso sería peor que no haberlo
intentado.

---

*Documento vivo. Cada afirmación aquí es discutible y varias serán falsas.
Las que más me importa que discutas: la retirada del nombre Teresa (§0), el
MVP manual (§3), y no cobrar comisión (§12). Si me convences en alguna,
mejor documento.*
