# La app de iOS

**Decisión del fundador (2026-09-25):** habrá una app de iOS que funcione
igual que la web, con los efectos y la sensación de una app nativa. Se hará
**cuando la web esté completa**. Hasta entonces, todo lo que se construye en
la web tiene que poder reutilizarse en la app.

Este documento dice qué pasa tal cual a la app, qué cambia y qué reglas
seguir desde ya para no tener que rehacer nada.

## 1. Lo que pasa tal cual

- **El servidor entero.** La función `helpers-write` y `perfil-ia` hablan
  JSON por HTTP. La app llama a las mismas operaciones (`encolar-aviso`,
  `respuestas`, `crear-alerta`, `valorar`…) con los mismos datos.
- **Las llaves.** Llave de lectura por conversación, llave de alerta, token
  del profesional: la app las guarda igual (en el llavero de iOS en vez de
  `localStorage`).
- **La base de datos, las cuentas (Supabase Auth) y las reglas de
  privacidad.** Nada de esto depende de que sea web.
- **La lógica de búsqueda** (`src/utils/matching.js`, `pideDeclarado.js`,
  `data/barrios.js`): es JavaScript sin navegador. Con React Native se usa
  tal cual; con Swift nativo habría que traducirla.

## 2. Lo que cambia

| En la web | En la app |
|---|---|
| Notificaciones con Web Push (VAPID), y en iPhone solo si se añade a la pantalla de inicio | Notificaciones nativas (APNs): llegan siempre, sin trucos |
| `public/sw.js` pregunta a Nüra qué ha pasado al recibir un aviso vacío | La app hace lo mismo al recibirla (o con una extensión de notificación) |
| `localStorage` / IndexedDB | Almacenamiento de la app y llavero de iOS |
| Enlaces `/r/:token`, `/baja/:token` | Los mismos, como enlaces universales que abren la app si está instalada |

**Lo único que habrá que añadir al servidor:** enviar a APNs además de Web
Push. `tocarMovil()` es el único sitio que toca el móvil; se le añade la
rama de Apple. La suscripción de la app se guarda en las mismas columnas
(`alertas.push`, `avisos.push`) con un campo que diga si es web o iOS. Los
avisos seguirán yendo **vacíos**: Apple tampoco verá qué busca nadie.

## 3. Reglas desde ya (para que la web sirva a la app)

1. **Toda escritura y toda lectura privada va por la función**, nunca desde
   el navegador con la clave pública. Así la app no necesita nada distinto.
2. **Nada de lógica importante solo en el navegador.** Lo que decide
   (permisos, topes, a quién se avisa) vive en el servidor.
3. **Las notificaciones, sin contenido**, y el detalle se pide con la llave.
   Vale igual para Web Push y para APNs.
4. **Textos y reglas de negocio en un solo sitio**, no repartidos por
   pantallas: facilita reutilizarlos.

## 4. Lo que pedirá Apple (App Store)

- **Borrar la cuenta desde dentro de la app.** Ya existe
  (`borrar-cuenta`): basta con enseñarlo igual.
- **Iniciar sesión con Apple** solo es obligatorio si se ofrece entrar con
  Google u otra red social. Hoy Nüra usa correo y contraseña: no hace falta.
- **Pagos:** los servicios los presta una persona fuera de la app (limpieza,
  clases, cuidados…). Apple permite cobrar esos servicios sin su sistema de
  compras. Si algún día se vende algo digital dentro de la app, sí lo pediría.
- **Política de privacidad y la ficha de «datos que recoge la app»**: la
  página `/legal/privacidad` ya cuenta todo; se copia a la ficha de la tienda.

## 5. Cuándo empezar

Cuando la web tenga todas las funciones y esté pulida. Antes de empezar,
decidir con el fundador: **React Native** (reutiliza casi todo el código de
la web) o **Swift nativo** (máxima sensación de iPhone, pero se reescribe la
interfaz y la búsqueda).
