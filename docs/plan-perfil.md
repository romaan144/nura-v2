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

### Paso 2 · La identidad, como la ficha ⬅ **SIGUIENTE**

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

### Paso 3 · Una cosa por bloque

Quince bloques con fondo en el perfil del profesional. Cada uno compite con
el siguiente. Fundir lo que es lo mismo y retirar lo que no sirve a nadie.

### Paso 4 · Las subpantallas

`Mis servicios` y `Siguiendo` se llegan desde aquí y tienen su propio
diseño. Revisar que sean la misma app: título, márgenes, tarjetas.

*(Parcialmente hecho en la etapa 6 del plan anterior — verificar y
completar.)*

### Paso 5 · El profesional ve lo suyo

El perfil del profesional muestra *"TU SEMANA · Semana tranquila · 0
abiertas"*. Eso es un panel, y está en el sitio equivocado: mezclado con sus
ajustes personales.

Decidir si se queda, se mueve o se retira.

### Paso 6 · Configuración al final

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
