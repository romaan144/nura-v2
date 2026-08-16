# Desplegar la función de Nüra sin terminal

*Todo por la web de Supabase. Unos 10 minutos.*

---

## Antes de empezar: qué es esto y por qué hace falta

Cerraste la escritura en `helpers`, que era lo correcto. La consecuencia es
que **el alta profesional ya no puede publicar**: escribía con la clave
pública, y esa clave ya no tiene permiso.

Esta función es la que sí lo tiene. Vive en el servidor de Supabase, guarda
la clave de servicio dentro (nunca sale al navegador de nadie) y hace tres
cosas:

- publicar el alta de un profesional nuevo
- guardar los seis eventos de uso
- montar el aviso a un profesional cuando alguien le escribe

---

## Paso 1 · Abrir el editor de funciones

1. Entra en **supabase.com** y abre tu proyecto.
2. En la columna izquierda busca **Edge Functions** (icono de un rayo).
3. Pulsa **Deploy a new function** y elige **Via Editor**.

*Si no ves "Via Editor", tu panel puede llamarlo "Create function" o
"New function". Cualquiera de esos sirve.*

---

## Paso 2 · El nombre (tiene que ser exacto)

Cuando pida el nombre, escribe:

```
helpers-write
```

**Exactamente así**: en minúsculas y con el guion. La app busca ese nombre;
si lo escribes distinto, no lo encontrará.

---

## Paso 3 · Pegar el código

1. Borra **todo** lo que traiga el editor de ejemplo.
2. Abre el archivo `helpers-write.ts` que te he dejado.
3. Copia su contenido **entero** y pégalo.
4. Pulsa **Deploy**.

Tarda unos segundos. Al terminar verás la función en la lista.

---

## Paso 4 · Decirle desde dónde aceptar peticiones

La función solo debe atender a tu app, no a cualquier web.

1. En la izquierda, ve a **Project Settings** (la rueda dentada).
2. Entra en **Edge Functions** y busca **Secrets**.
3. Añade un secreto nuevo:

   - **Nombre:** `NURA_ORIGINS`
   - **Valor:** la URL de tu app, tal cual, sin barra al final.
     Por ejemplo: `https://nura-v2-two.vercel.app`

Guarda.

*`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase solo. No
tienes que tocarlos, y no debes copiarlos a ningún sitio.*

---

## Paso 5 · Copiar la dirección de la función

En la página de la función verás una URL parecida a:

```
https://oxmohciswebonoumghhu.functions.supabase.co/helpers-write
```

**Cópiala.** La necesitas para el paso siguiente.

---

## Paso 6 · Encenderla en Vercel

1. Entra en **vercel.com**, abre el proyecto de Nüra.
2. **Settings** y luego **Environment Variables**.
3. Añade estas dos:

   | Nombre | Valor |
   |---|---|
   | `VITE_EDGE_WRITES` | `true` |
   | `VITE_EDGE_URL` | la URL que copiaste en el paso 5 |

4. Ve a la pestaña **Deployments**, y en el último despliegue pulsa
   **Redeploy**.

Sin ese último paso no sirve de nada: las variables solo entran al
construir de nuevo.

---

## Paso 7 · Comprobar que funciona

Abre tu app y **date de alta como profesional**, con tu propio móvil en la
pregunta del contacto.

- **Si al terminar dice** *"Tu perfil está listo. ¡Ya formas parte de la
  red!"* → funciona.
- **Si dice** *"todavía no he podido publicarlo para que te encuentren"* →
  algo falta. No es grave: la app te está diciendo la verdad en vez de
  fingir.

Y compruébalo en Supabase, en el SQL Editor:

```sql
select id, name, specialty, contacto
from helpers
order by id desc
limit 5;
```

Si tu alta aparece arriba **con el contacto guardado**, está todo conectado.

---

## Si algo falla

En la página de la función, pestaña **Logs**, verás el error real.

- **401 / 403** → revisa `NURA_ORIGINS`: tiene que ser la URL exacta de tu
  app, sin barra final.
- **404** → el nombre de la función no es `helpers-write`.
- **La app sigue sin publicar** → ¿hiciste el **Redeploy** en Vercel?

Pégame el error y lo miramos.

---

## Lo que NO tienes que hacer

- No instalar nada.
- No abrir ninguna terminal.
- **No copiar nunca la `service_role key`** a ningún archivo ni pegármela.
  Vive dentro de Supabase y ahí se queda.
