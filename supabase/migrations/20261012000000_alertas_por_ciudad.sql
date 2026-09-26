-- «Te aviso si aparece alguien» en cualquier ciudad. Hasta ahora una alerta
-- solo podia acotarse a un barrio de Barcelona. Ahora puede guardar la
-- ciudad (una de la lista de la app; la funcion rechaza cualquier otra) y
-- solo avisa de quien trabaja alli u online. Solo el nombre de la ciudad:
-- nunca la frase que escribio la persona.
alter table public.alertas add column if not exists ciudad text
  check (ciudad is null or char_length(ciudad) <= 60);
