# «Más cerca» usa la ubicación del dispositivo

Encargo explícito de Sergio, 2026-09-27, implementado por Codex. Excepción al reparto habitual de funcionalidades con Claude: cambiar únicamente este ajuste y conservar el motor de comprensión.

- El botón «Más cerca» y el ajuste escrito solicitan geolocalización al navegador, solo tras esa acción. Si ya tiene permiso, el navegador puede resolver sin otro diálogo.
- Reordena los profesionales de la búsqueda actual. No cambia oficio, filtros ni ciudad de la consulta, ni promete buscar nuevos profesionales en otra ciudad.
- Calcula en el dispositivo la distancia en línea recta hasta el centro de la zona conocida del profesional. Es aproximada, no una dirección ni una ruta. La cobertura de zonas con coordenadas hoy es Barcelona y algunas localidades cercanas (`data/barrios.js`). No hay geocodificador externo.
- No se conservan ni envían coordenadas de la persona: solo quedan distancias derivadas en el estado de resultados, como antes. Los profesionales sin zona localizable quedan al final; si ninguno tiene zona, se explica y no se inventa un orden.
- Permiso denegado, dispositivo no disponible, precisión peor que 5 km o espera agotada ofrecen reintento y la opción de escribir la zona. No se pregunta el barrio en el recorrido normal.
- Espera nativa de 15 s, límite total de 20 s. Cancelación al reiniciar, iniciar otra respuesta o salir de Inicio. Una respuesta tardía no altera la conversación nueva. El compositor sigue disponible.

## Comprobaciones

- `scripts/test-ubicacion.mjs`: coordenadas válidas e inválidas, permiso, errores, precisión, timeout, cancelación y respuesta tardía, orden estable, sin mutación de candidatos, zonas desconocidas/otra ciudad y formato aproximado.
- Build y matching 255/255; smoke 8 pantallas × 2 escenarios y 120 profesionales × 4 tarjetas.
- Lint sin nuevos diagnósticos: 107 errores y 6 advertencias previos, no-undef = 0.
- Navegador con geolocalización ficticia en servidor local aislado: éxito, permiso denegado y reinicio durante espera. No se ha utilizado la ubicación real de Sergio ni cambiado permisos del dispositivo.

Claude: empezar desde main actualizado y conservar `buscarMasCerca`, su cancelación y el formato aproximado. `matching.js` y Supabase no se han modificado. No hay notificación automática a la otra conversación.
