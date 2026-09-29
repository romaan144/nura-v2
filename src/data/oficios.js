// ── LOS OFICIOS ──────────────────────────────────────────────────────────
//
// La búsqueda entendía CATEGORÍAS («técnico», «salud») y dentro de ellas
// ganaba el mejor valorado. «reparar altavoces 2.1» caía en «técnico» por
// «reparar» y devolvía un fontanero. Y la base agrupa mal: 57 logopedas y
// casi todos los entrenadores están guardados como «salud», informáticos y
// fotógrafos como «técnico»…, así que pedir por categoría ni siquiera
// traía a quien hacía falta.
//
// Aquí cada OFICIO dice:
//   esp    cómo se llama en las fichas (patrones sobre la especialidad, sin
//          tildes: `_` vale por una letra, como en la base de datos).
//   dice   lo que escribe quien lo necesita: el oficio, los objetos, los
//          síntomas. «palabra|5» pesa 5 (3 si no se dice). `*` deja hasta
//          cuatro palabras en medio («perro * enfermo»). Los plurales cuentan.
//   refina qué especialidad sube dentro del oficio según lo que cuente
//          («terapia» + «pareja» → terapeuta de pareja). Pesa 40; lo que
//          solo dice a QUIÉN es (un niño, un adulto) pesa 25, y lo general
//          («ansiedad» → clínica), 10: manda lo más concreto.
//   cat    la categoría de la app (textos, avisos, Explorar).
//   quien  para decir con verdad que falta: «Todavía no tengo a nadie …».
//   requiere   si lo tiene, solo cuenta cuando la frase nombra una de
//          estas palabras (el veterinario, un animal).
//   parecidos  si no hay nadie del oficio, a quién se ofrece (diciéndolo).
//
// Añadir un oficio o una forma de pedirlo es añadir una línea aquí y una
// frase a scripts/test-busqueda.mjs.

export const OFICIOS = [
  // ── Casa: instalaciones ─────────────────────────────────────────────
  { id: 'fontanero', nombre: 'fontanero', cat: 'tecnico', quien: 'que sea fontanero',
    esp: ['fontaner', 'lampista'],
    dice: ['fuita|6', 'fuita d aigua|9', 'aigua|2', 'aixeta|6', 'desembussar|8', 'fontanero|8', 'fontanera|8', 'fontaneria|8', 'lampista|8', 'fuga|5', 'fuga de agua|6', 'gotea|5', 'gotera|4',
      'grifo|5', 'atascado|5', 'atascada|5', 'atasco|5', 'desatascar|6', 'desatasco|6', 'fregadero|4', 'vater|5', 'wc|5',
      'inodoro|5', 'cisterna|5', 'tuberia|5', 'caneria|5', 'desague|5', 'sumidero|5', 'ducha|2', 'banera|3', 'agua|1',
      'pierde agua|3', 'no sale agua|3', 'sin agua|3', 'llave de paso|5'] },
  { id: 'electricista', nombre: 'electricista', cat: 'tecnico', quien: 'que sea electricista',
    esp: ['electricist'],
    dice: ['electricista|8', 'electricitat|8', 'electricidad|5', 'luz|2', 'se va la luz|7', 'se fue la luz|7', 'sin luz|5',
      'saltan los plomos|8', 'plomos|5', 'diferencial|5', 'cuadro electrico|7', 'enchufe|5', 'interruptor|5',
      'lampara|4', 'punto de luz|6', 'puntos de luz|6', 'cableado|5', 'cables|3', 'cortocircuito|6', 'no hay corriente|7',
      'corriente|2', 'boletin electrico|8', 'boletin|4', 'bombilla|2', 'instalacion electrica|7', 'foco|2', 'focos|2'] },
  { id: 'calefaccion', nombre: 'técnico de calefacción', cat: 'tecnico', quien: 'que arregle calderas o calefacción',
    esp: ['calder', 'calefacc'],
    dice: ['caldera|8', 'calefaccion|7', 'radiador|6', 'no calienta|2', 'agua caliente|4', 'termo|4', 'calentador|5',
      'suelo radiante|6', 'frio en casa|4', 'hace frio en casa|5'] },
  { id: 'gas', nombre: 'técnico de gas', cat: 'tecnico', quien: 'que sea técnico de gas',
    esp: ['gas natural'],
    dice: ['gas|4', 'huele a gas|9', 'olor a gas|9', 'fuga de gas|9', 'butano|5', 'instalacion de gas|8', 'revision del gas|8',
      'certificado de gas|8', 'cocina de gas|4'] },
  { id: 'clima', nombre: 'técnico de aire acondicionado', cat: 'tecnico', quien: 'que instale o arregle aire acondicionado',
    esp: ['aire acondicionado', 'climatiz'],
    dice: ['el aire|6', 'el aire gotea|9', 'aire acondicionado|8', 'split|6', 'climatizacion|7', 'bomba de calor|6', 'no enfria|2', 'aire acondicionat|8'] },
  { id: 'cerrajero', nombre: 'cerrajero', cat: 'tecnico', quien: 'que sea cerrajero',
    esp: ['cerraj'],
    dice: ['cerrajero|8', 'cerrajera|8', 'cerrajeria|8', 'manya|8', 'cerradura|6', 'bombin|6', 'llaves|4', 'llave|2',
      'quedado fuera|7', 'me he quedado fuera|8', 'no puedo entrar|6', 'puerta blindada|5', 'abrir la puerta|5',
      'cerrado por fuera|6'] },
  { id: 'electrodomesticos', nombre: 'técnico de electrodomésticos', cat: 'tecnico', quien: 'que arregle electrodomésticos',
    esp: ['electrodom'],
    dice: ['electrodomestico|8', 'lavadora|6', 'lavavajillas|6', 'secadora|6', 'frigorifico|6', 'nevera|6', 'congelador|6',
      'horno|4', 'microondas|6', 'vitroceramica|6', 'placa de induccion|6', 'induccion|4', 'campana extractora|6',
      'extractor|4', 'cafetera|4', 'aspiradora|4', 'no centrifuga|6', 'no enfria|2'] },
  // Sin nadie en la base todavía: se dice y se ofrece lo más parecido.
  { id: 'electronica', nombre: 'técnico de electrónica', cat: 'tecnico', quien: 'que repare aparatos de sonido o imagen',
    esp: ['electr_nic', 'sonido', 'televis'],
    parecidos: ['electrodomesticos', 'informatico', 'moviles'],
    dice: ['play|6', 'la play|8', 'lee los discos|6', 'no lee|3', 'mando a distancia|4', 'altavoz|8', 'altavoces|8', 'equipo de musica|8', 'equipo de sonido|8', 'amplificador|8', 'tele|6',
      'television|7', 'televisor|8', 'smart tv|8', 'proyector|6', 'consola|6', 'playstation|8', 'xbox|8', 'nintendo|7',
      'auriculares|5', 'barra de sonido|8', 'subwoofer|8', 'hifi|8', 'minicadena|8', 'tocadiscos|8', 'radio|3',
      'electronica|5', 'aparato|2', 'aparatos|2'] },
  { id: 'moviles', nombre: 'técnico de móviles', cat: 'tecnologia', quien: 'que repare móviles',
    esp: ['de m_viles'],
    dice: ['movil|4', 'pantalla del movil|8', 'iphone|6', 'smartphone|6', 'telefono|3', 'tablet|4', 'ipad|5',
      'reparar el movil|8', 'bateria del movil|8', 'bateria del iphone|8', 'se me ha caido el movil|8'] },
  { id: 'informatico', nombre: 'informático', cat: 'tecnologia', quien: 'que sea informático',
    esp: ['inform_tic', 'ordenador'],
    dice: ['hackeado|8', 'hackeada|8', 'me han hackeado|10', 'hackeo|8', 'contrasena|4', 'correo|3', 'antivirus|7', 'informatico|8', 'informatica|6', 'ordenador|6', 'pc|5', 'portatil|6', 'windows|6', 'mac|4', 'macbook|6',
      'virus|5', 'disco duro|7', 'formatear|6', 'impresora|6', 'software|4', 'teclado|3', 'copia de seguridad|6',
      'recuperar datos|7', 'recuperar fotos|4', 'programas|3', 'correo electronico|4', 'va muy lento|3', 'lento|2',
      'no arranca|2', 'con el ordenador|6'] },
  { id: 'wifi', nombre: 'especialista en wifi', cat: 'tecnologia', quien: 'que arregle el wifi',
    esp: ['wifi'], parecidos: ['informatico'],
    dice: ['wifi|8', 'router|7', 'internet|4', 'fibra|4', 'no llega el wifi|8', 'cobertura|3', 'red wifi|8', 'repetidor|6'] },

  // ── Casa: obras, acabados, montaje ─────────────────────────────────
  { id: 'pintor', nombre: 'pintor', cat: 'tecnico', quien: 'que sea pintor',
    esp: ['pintor'],
    dice: ['pintor|8', 'pintora|8', 'pintar|6', 'pinte|6', 'pinten|6', 'pintarme|6', 'pintura|3', 'gotele|8', 'lacar|5',
      'paredes|2', 'pintar el piso|8'] },
  { id: 'albanil', nombre: 'albañil', cat: 'hogar', quien: 'que sea albañil',
    esp: ['alba_il'],
    dice: ['albanil|8', 'paleta|6', 'obra|3', 'obras|3', 'reforma|4', 'reformar|4', 'reformas|4', 'alicatar|8', 'azulejo|6',
      'baldosa|6', 'tabique|6', 'pladur|6', 'humedad|3', 'humedades|3', 'grieta|5', 'yeso|4', 'escayola|5', 'cemento|5',
      'plato de ducha|4', 'reformar el bano|8', 'reforma del bano|8', 'reformar la cocina|8', 'reforma de la cocina|8',
      'rozas|5'] },
  { id: 'carpintero', nombre: 'carpintero', cat: 'tecnico', quien: 'que sea carpintero',
    esp: ['carpinter'],
    dice: ['carpintero|8', 'carpintera|8', 'carpinteria|8', 'fuster|8', 'a medida|4', 'mueble a medida|8',
      'armario empotrado|8', 'madera|4', 'puerta|2', 'puertas|2', 'tarima|5', 'parquet|5', 'rodapie|5', 'barnizar|4',
      'no cierra|2', 'encimera|4'] },
  { id: 'persianas', nombre: 'técnico de persianas', cat: 'hogar', quien: 'que arregle persianas',
    esp: ['persian'],
    dice: ['persiana|8', 'estor|7', 'estores|7', 'cinta de la persiana|8', 'toldo|6', 'mosquitera|6', 'cortinas|3'] },
  { id: 'manitas', nombre: 'manitas', cat: 'hogar', quien: 'que haga pequeños arreglos',
    esp: ['manitas'],
    dice: ['manitas|8', 'colgar|4', 'cuadros|3', 'estanteria|4', 'estanterias|4', 'balda|4', 'pequenos arreglos|7',
      'chapuzas|6', 'arreglillos|6', 'taladrar|5', 'taladro|4', 'agujeros|3', 'cortina|3', 'barra de cortina|6'] },
  { id: 'montador', nombre: 'montador de muebles', cat: 'hogar', quien: 'que monte muebles',
    esp: ['montador', 'montaje de muebles'],
    dice: ['montar muebles|8', 'montar un mueble|8', 'montar un armario|8', 'montar una cama|8', 'ikea|6', 'montador|8',
      'montaje|4', 'desmontar|4', 'muebles|2', 'mueble|2'] },
  { id: 'jardinero', nombre: 'jardinero', cat: 'hogar', quien: 'que sea jardinero',
    esp: ['jardin', 'paisaj'],
    dice: ['jardin|6', 'jardinero|8', 'jardinera|8', 'jardineria|8', 'cesped|7', 'podar|7', 'poda|6', 'setos|7',
      'plantas|4', 'terraza|2', 'riego|5', 'huerto|6', 'arboles|4', 'paisajista|8'] },
  { id: 'arquitecto', nombre: 'arquitecto', cat: 'hogar', quien: 'que sea arquitecto',
    esp: ['arquitect', 'aparejador', 'architect'],
    dice: ['arquitecto|8', 'arquitecta|8', 'aparejador|8', 'planos|5', 'licencia de obra|8', 'ampliar la casa|7',
      'ampliacion|5', 'reforma integral|6', 'certificado energetico|9', 'cedula de habitabilidad|9', 'obra nueva|7',
      'construir una casa|8', 'passivhaus|8', 'direccion de obra|8', 'proyecto de reforma|7'] },
  { id: 'interiorista', nombre: 'interiorista', cat: 'hogar', quien: 'que sea interiorista',
    esp: ['dise_ador de interiores', 'dise_adora de interiores', 'espacios comerciales', 'interiorista'],
    dice: ['interiorista|8', 'interiorismo|8', 'diseno de interiores|9', 'decorar|4', 'decoracion|4', 'decorador|4',
      'redecorar|5', 'decorar mi casa|7', 'decorar el salon|7'] },

  // ── Casa: limpieza y tareas ────────────────────────────────────────
  { id: 'limpieza', nombre: 'limpieza', cat: 'hogar', quien: 'que haga limpieza',
    esp: ['limpieza d_m', 'limpieza del hogar', 'limpieza por horas', 'limpieza profunda', 'limpieza ecol',
      'limpieza post', 'limpieza oficinas', 'cristales'],
    refina: [
      { esp: 'post obra', si: ['obra', 'obras', 'reforma'] },
      { esp: 'oficinas', si: ['oficina', 'oficinas', 'local', 'despacho', 'negocio'] },
      { esp: 'cristales', si: ['cristales', 'ventanas'] },
      { esp: 'ecolog', si: ['ecologico', 'ecologica', 'sin quimicos'] },
      { esp: 'profunda', si: ['a fondo', 'profunda', 'mudanza'] },
    ],
    dice: ['limpio|4', 'piso limpio|8', 'dejar el piso limpio|10', 'dejar la casa limpia|10', 'casa limpia|6', 'limpiar|5', 'limpieza|5', 'limpie|5', 'limpiadora|8', 'asistenta|7', 'empleada del hogar|8', 'fregar|5',
      'barrer|5', 'polvo|3', 'sucio|4', 'sucia|4', 'a fondo|2', 'cristales|4', 'despues de una obra|4'] },
  { id: 'plancha', nombre: 'plancha', cat: 'hogar', quien: 'que planche',
    esp: ['plancha'],
    dice: ['planchar|8', 'planche|8', 'planchen|8', 'plancha|6', 'planchado|8', 'camisas|3'] },
  { id: 'organizacion', nombre: 'organización del hogar', cat: 'hogar', quien: 'que ayude a ordenar la casa',
    esp: ['organizaci_n del hogar', 'konmari'],
    dice: ['ordenar|5', 'organizar la casa|8', 'organizar el piso|8', 'organizar mi casa|8', 'armarios|3', 'desorden|6',
      'konmari|8', 'trastero|4', 'ordenar los armarios|9'] },
  { id: 'cocinero', nombre: 'cocinero', cat: 'hogar', quien: 'que cocine a domicilio',
    esp: ['cociner'],
    dice: ['cocinero|8', 'cocinera|8', 'chef|7', 'cocinar|5', 'cocine|5', 'cena|3', 'comida|3', 'hacer la comida|8',
      'haga la comida|8', 'batch cooking|8', 'menus semanales|8', 'tupper|5', 'comida casera|8'] },
  { id: 'mudanzas', nombre: 'mudanzas', cat: 'hogar', quien: 'que haga mudanzas',
    esp: ['mudanzas y transporte', 'transportista'], parecidos: [],
    dice: ['mudanza|8', 'mudanzas|8', 'mudarme|8', 'mudarnos|8', 'mudar|6', 'portes|8', 'transportar muebles|8',
      'trasladar muebles|8', 'furgoneta|4'] },

  // ── Personas ───────────────────────────────────────────────────────
  { id: 'cuidadora', nombre: 'cuidadora', cat: 'cuidado', quien: 'que cuide de personas mayores',
    esp: ['cuidadora de mayores', 'cuidadora de personas', 'cuidadora personas', 'cuidadora nocturna', 'cuidadora post',
      'geri_tric', 'ayuda a domicilio', 'asistente personal', 'auxiliar personas'],
    refina: [
      { esp: 'alzheimer', si: ['alzheimer', 'demencia', 'parkinson', 'memoria', 'desorienta'] },
      { esp: 'nocturn', si: ['noche', 'noches', 'nocturna', 'madrugada', 'dormir'] },
      { esp: 'post operatorio|postoperatorio', si: ['operacion', 'operado', 'operada', 'hospital', 'cirugia', 'postoperatorio'] },
      { esp: 'discapacidad', si: ['discapacidad', 'silla de ruedas', 'movilidad reducida', 'paralisis'] },
      { esp: 'mayores|geriatr', si: ['mayor', 'mayores', 'abuela', 'abuelo', 'anciano', 'anciana'], peso: 25 },
    ],
    dice: ['cuidi|6', 'cuidar|3', 'la meva mare|6', 'el meu pare|6', 'la meva avia|7', 'el meu avi|7', 'mare|2', 'pare|2', 'cuidadora|6', 'cuidador|6', 'cuidar a mi madre|8', 'cuidar a mi padre|8', 'cuidar * madre|7', 'cuidar * padre|7',
      'cuidar * abuela|8', 'cuidar * abuelo|8', 'abuela|4', 'abuelo|4', 'mayor|3', 'mayores|4', 'anciano|5', 'anciana|5',
      'persona mayor|6', 'acompanar|3', 'acompane|3', 'acompanamiento|4', 'alzheimer|8', 'demencia|8', 'parkinson|4',
      'dependencia|5', 'vive sola|6', 'vive solo|6', 'geriatrico|6', 'geriatrica|6', 'ayuda a domicilio|7',
      'sale del hospital|7', 'operacion|3', 'postoperatorio|7', 'silla de ruedas|7', 'discapacidad|7',
      'movilidad reducida|7', 'asistente personal|8', 'madre|1', 'padre|1', 'gent gran|7', 'avi|4', 'avia|4'] },
  { id: 'enfermera', nombre: 'enfermera', cat: 'cuidado', quien: 'que sea enfermera',
    esp: ['enfermer'], parecidos: ['cuidadora'],
    dice: ['curar|5', 'herida|5', 'curar una herida|9', 'ulcera|7', 'escaras|8', 'glucosa|5', 'insulina|7', 'enfermera|8', 'enfermero|8', 'inyeccion|7', 'inyecciones|7', 'curas|6', 'cura|3', 'vendaje|6', 'sonda|6',
      'tomar la tension|6', 'pinchar|4', 'heparina|8', 'puntos|2'] },
  { id: 'canguro', nombre: 'canguro', cat: 'cuidado', quien: 'que cuide de niños',
    esp: ['canguro', 'ni_era'],
    dice: ['cuidar * bebe|8', 'cuide * bebe|8', 'nen|3', 'nens|3', 'fill|2', 'filla|2', 'fills|3', 'canguro|8', 'cangur|8', 'ninera|8', 'au pair|8', 'cuidar * hijo|7', 'cuidar * hijos|7', 'cuidar * hija|7',
      'cuidar * ninos|7', 'cuide * ninos|7', 'cuide * hijos|7', 'recoger * cole|7', 'recoger del colegio|7',
      'guarderia|5', 'bebe|2', 'ninos|2', 'nino|2', 'hijos|2', 'peques|2', 'tarde con los ninos|6'] },

  // ── Mascotas ───────────────────────────────────────────────────────
  { id: 'paseador', nombre: 'paseador de perros', cat: 'mascotas', quien: 'que pasee perros',
    esp: ['paseador'],
    dice: ['saque * perro|8', 'sacar * perro|8', 'sacar al perro|8', 'bajar al perro|8', 'pasear * perro|8', 'pasear * perra|8', 'paseador|8', 'paseadora|8', 'paseos|3', 'paseo|3', 'pasee|5'] },
  { id: 'cuidador_mascotas', nombre: 'cuidador de mascotas', cat: 'mascotas', quien: 'que cuide mascotas',
    esp: ['felina', 'pet sitter', 'cuidadora de perros', 'cuidador de mascotas'],
    refina: [{ esp: 'felina', si: ['gato', 'gatos', 'gata', 'gatito'] }, { esp: 'perros', si: ['perro', 'perros', 'perra'] }],
    dice: ['cuidar * gato|8', 'cuidar * perro|8', 'cuidar * mascota|8', 'cuidar * gatos|8', 'cuidar * perros|8',
      'pet sitter|8', 'canguro de gatos|9', 'canguro de perros|9', 'cuidadora de animales|8', 'cuidador de animales|8',
      'mascota|3', 'mascotas|3', 'gato|3', 'gatos|3', 'perro|2', 'vacaciones|2', 'me voy de viaje|3', 'gos|2', 'gat|3'] },
  { id: 'adiestrador', nombre: 'adiestrador canino', cat: 'mascotas', quien: 'que adiestre perros',
    esp: ['adiestr', 'educaci_n cachorros'],
    dice: ['adiestrar|8', 'adiestrador|8', 'adiestradora|8', 'adiestramiento|8', 'educar * perro|8', 'educar * cachorro|8',
      'educar|3', 'muerde|6', 'ladra|6', 'tira de la correa|7', 'obediencia|6', 'cachorro|4', 'agresivo|4',
      'comportamiento del perro|8', 'no obedece|6'] },
  { id: 'peluqueria_canina', nombre: 'peluquería canina', cat: 'mascotas', quien: 'que haga peluquería canina',
    esp: ['grooming', 'peluquera canina', 'est_tica canina'],
    dice: ['banar * perro|8', 'banar|4', 'cortar el pelo * perro|9', 'peluqueria canina|9', 'peluquera canina|9',
      'grooming|9', 'cortar las unas * perro|8', 'deslanar|8'] },
  { id: 'veterinario', nombre: 'veterinario', cat: 'mascotas', quien: 'que sea veterinario',
    // Los síntomas solo cuentan si habla de un animal: «tengo diarrea» no es para el veterinario.
    requiere: ['perro', 'perra', 'gato', 'gata', 'perrito', 'gatito', 'cachorro', 'mascota', 'conejo', 'animal', 'hamster', 'pajaro', 'veterinario', 'veterinaria', 'gos', 'gat'],
    esp: ['veterinar'],
    dice: ['diarrea|4', 'vomitos|4', 'vomitando|4', 'sangra|3', 'herida|3', 'no come|4', 'esta enfermo|4', 'esta enferma|4', 'fiebre|2', 'se rasca|4', 'cojea|4', 'veterinario|8', 'veterinaria|8', 'perro * enfermo|8', 'gato * enfermo|8', 'perra * enferma|8',
      'gata * enferma|8', 'vacuna|4', 'vacunas|4', 'vomita|4', 'cojea|4', 'no come|2', 'pulgas|4', 'garrapata|5'] },

  // ── Salud: mente ───────────────────────────────────────────────────
  { id: 'psicologo', nombre: 'psicólogo', cat: 'salud', quien: 'que sea psicólogo',
    esp: ['psic_log', 'cognitivo', 'terapeuta de pareja', 'emdr'],
    refina: [
      { esp: 'pareja', si: ['pareja', 'marido', 'mujer', 'novio', 'novia', 'matrimonio'] },
      { esp: 'infant', si: ['hijo', 'hija', 'nino', 'nina', 'adolescente', 'infantil', 'peque', 'hijos'], peso: 25 },
      { esp: 'perinatal', si: ['posparto', 'postparto', 'embarazo', 'embarazada', 'parto', 'maternidad'] },
      { esp: 'burnout|laboral', si: ['trabajo', 'quemado', 'quemada', 'burnout', 'jefe'] },
      { esp: 'trauma|emdr', si: ['trauma', 'emdr', 'abuso', 'traumatico'] },
      { esp: 'forense', si: ['juicio', 'peritaje', 'forense', 'custodia'] },
      { esp: 'neuropsicolog', si: ['neuropsicologica', 'neuropsicologo', 'neuropsicologa', 'deterioro'] },
      { esp: 'clinic|cognitiv', si: ['ansiedad', 'depresion', 'panico', 'fobia'], peso: 10 },
    ],
    dice: ['relacionarme|7', 'timidez|7', 'timido|6', 'timida|6', 'habilidades sociales|8', 'nervioso|4', 'nerviosa|4', 'nervios|4', 'embarazada|3', 'miedo a|3', 'panico a|6', 'adolescente|4', 'no quiere ir al instituto|6', 'no quiere ir al colegio|6', 'conducta|5', 'rabietas|5', 'no levanto cabeza|9', 'perdi a|4', 'sin ganas de nada|8', 'ganas de llorar|8', 'me siento solo|7', 'me siento sola|7', 'lo estoy pasando mal|8', 'psicologo|8', 'psicologa|8', 'psicologia|8', 'sicologo|8', 'sicologa|8', 'terapia|3', 'ansiedad|6',
      'depresion|6', 'estres|4', 'mala racha|6', 'hablar con alguien|6', 'triste|4', 'tristeza|4', 'angustia|5',
      'ataques de panico|8', 'panico|5', 'autoestima|5', 'duelo|5', 'fobia|6', 'trauma|5', 'emdr|8', 'terapia de pareja|8',
      'crisis de pareja|8', 'quemado|3', 'burnout|6', 'posparto|4', 'neuropsicologo|8', 'neuropsicologa|8',
      'neuropsicologica|8', 'desahogarme|6', 'agobiado|4', 'agobiada|4', 'deprimido|6', 'deprimida|6'] },
  { id: 'psiquiatra', nombre: 'psiquiatra', cat: 'salud', quien: 'que sea psiquiatra',
    esp: ['psiquiatr'], parecidos: ['psicologo'],
    dice: ['psiquiatra|9', 'psiquiatria|9', 'medicacion para la depresion|8', 'antidepresivos|7'] },
  { id: 'bienestar', nombre: 'meditación y bienestar', cat: 'salud', quien: 'que enseñe meditación',
    esp: ['mindfulness', 'meditaci_n', 'coach de vida', 'reiki', 'reflexolog'],
    refina: [{ esp: 'reiki', si: ['reiki', 'energias'] }, { esp: 'reflexolog', si: ['reflexologia', 'pies'] },
      { esp: 'coach', si: ['coach', 'coaching', 'motivacion', 'proposito'] }],
    dice: ['meditacion|7', 'meditar|7', 'mindfulness|8', 'relajacion|4', 'relajarme|4', 'coach de vida|8', 'coaching|6',
      'reiki|8', 'reflexologia|8', 'energias|3'] },

  // ── Salud: cuerpo ──────────────────────────────────────────────────
  { id: 'fisio', nombre: 'fisioterapeuta', cat: 'salud', quien: 'que sea fisioterapeuta',
    esp: ['fisio', 'rehabilitaci_n', 'osteop', 'quiromasaj', 'masajista', 'suelo p_lvico'],
    refina: [
      { esp: 'deportiva', si: ['futbol', 'correr', 'deporte', 'esguince', 'gimnasio', 'baloncesto', 'tenis', 'padel'] },
      { esp: 'pediatrica', si: ['bebe', 'hijo', 'hija', 'nino', 'nina'], peso: 25 },
      { esp: 'neurologica', si: ['ictus', 'parkinson', 'esclerosis', 'neurologico'] },
      { esp: 'respiratoria', si: ['respirar', 'respiratoria', 'epoc', 'pulmon', 'pulmones', 'mucosidad'] },
      { esp: 'oncologica', si: ['cancer', 'oncologico', 'linfedema', 'mastectomia'] },
      { esp: 'post cirugia|rehabilitacion', si: ['operacion', 'cirugia', 'operado', 'operada', 'protesis', 'rehabilitacion'] },
      { esp: 'suelo pelvico', si: ['suelo pelvico', 'parto', 'incontinencia', 'perdidas de orina', 'posparto'] },
      { esp: 'masaj', si: ['masaje', 'masajes', 'relajante', 'contractura', 'masajista'] },
      { esp: 'osteop', si: ['osteopata', 'osteopatia'] },
    ],
    dice: ['me duele * cuello|10', 'me duele * espalda|10', 'me duele * hombro|10', 'me duele * rodilla|10', 'me duele * tobillo|10', 'me duele * cadera|10', 'me duele * brazo|10', 'me duele * pierna|10', 'me duele * muneca|10', 'dolor de cuello|9', 'dolor de espalda|9', 'cuello|5', 'perdidas de orina|9', 'di a luz|6', 'dar a luz|6', 'desde el parto|6', 'torcido|4', 'contracturas|6', 'fisio|8', 'fisioterapeuta|8', 'fisioterapia|8', 'espalda|5', 'lumbago|7', 'lumbar|5', 'cervicales|6',
      'contractura|6', 'esguince|6', 'tobillo|4', 'rodilla|4', 'hombro|4', 'me duele|2', 'dolor de|2', 'lesion|4',
      'rehabilitacion|6', 'rehabilitar|6', 'ciatica|7', 'hernia|5', 'tendinitis|7', 'suelo pelvico|9', 'masaje|6',
      'masajes|6', 'masajista|8', 'osteopata|9', 'osteopatia|9', 'quiromasaje|9', 'quiromasajista|9', 'cadera|3',
      'incontinencia|4'] },
  { id: 'acupuntura', nombre: 'acupuntor', cat: 'salud', quien: 'que haga acupuntura',
    esp: ['acupuntura'], parecidos: ['bienestar'],
    dice: ['acupuntura|9', 'medicina china|9', 'agujas|3'] },
  { id: 'medico', nombre: 'médico', cat: 'salud', quien: 'que sea médico',
    esp: ['m_dic_ internista', 'm_dic_ de familia', 'm_dic_ general', 'm_dico a domicilio'],
    dice: ['mareo|6', 'me mareo|8', 'mareos|6', 'vertigo|6', 'dolor de cabeza|5', 'migrana|6', 'tension baja|6', 'cansancio|3', 'medico|7', 'medica|7', 'doctor|6', 'doctora|6', 'medico a domicilio|9', 'medico de cabecera|9',
      'medico de familia|9', 'consulta medica|8', 'receta|4', 'fiebre|3', 'gripe|4', 'analisis|3', 'chequeo|5',
      'internista|8', 'me encuentro mal|5'] },
  { id: 'pediatra', nombre: 'pediatra', cat: 'salud', quien: 'que sea pediatra',
    esp: ['pediatra'], parecidos: ['medico'],
    dice: ['pediatra|10', 'pediatria|10', 'bebe * fiebre|8', 'fiebre * bebe|8', 'hijo * fiebre|7', 'hija * fiebre|7'] },
  { id: 'dermatologo', nombre: 'dermatólogo', cat: 'salud', quien: 'que sea dermatólogo',
    esp: ['dermat'], parecidos: ['medico'],
    dice: ['dermatologo|10', 'dermatologa|10', 'dermatologia|10', 'piel|5', 'mancha en la piel|9', 'lunar|6', 'lunares|6',
      'acne|7', 'eccema|7', 'psoriasis|7', 'dermatitis|7', 'granos|4'] },
  { id: 'ginecologo', nombre: 'ginecólogo', cat: 'salud', quien: 'que sea ginecólogo',
    esp: ['ginec'], parecidos: ['medico'],
    dice: ['embarazada|4', 'embarazo|4', 'ginecologo|10', 'ginecologa|10', 'ginecologia|10', 'regla|4', 'menstruacion|6', 'revision ginecologica|10',
      'anticonceptivos|6', 'menopausia|6'] },
  { id: 'cardiologo', nombre: 'cardiólogo', cat: 'salud', quien: 'que sea cardiólogo',
    esp: ['cardi'], parecidos: ['medico'],
    dice: ['cardiologo|10', 'cardiologa|10', 'corazon|6', 'tension alta|6', 'hipertension|7', 'arritmia|8',
      'palpitaciones|7', 'colesterol|4'] },
  { id: 'reumatologo', nombre: 'reumatólogo', cat: 'salud', quien: 'que sea reumatólogo',
    esp: ['reumat'], parecidos: ['medico'],
    dice: ['articulaciones|7', 'duelen las articulaciones|10', 'manos hinchadas|7', 'rigidez|5', 'reumatologo|10', 'reumatologa|10', 'artritis|8', 'artrosis|7', 'reuma|6', 'fibromialgia|8', 'dolor articular|7'] },
  { id: 'nutricionista', nombre: 'nutricionista', cat: 'salud', quien: 'que sea nutricionista',
    esp: ['nutric', 'dietista', 'p_rdida de peso', 'obesidad', 'alimentarios'],
    refina: [
      { esp: 'deportiva', si: ['deporte', 'gimnasio', 'rendimiento', 'deportista', 'musculo'] },
      { esp: 'pediatrica', si: ['hijo', 'hija', 'nino', 'nina', 'bebe'], peso: 25 },
      { esp: 'vegan', si: ['vegano', 'vegana', 'vegetariano', 'vegetariana'] },
      { esp: 'oncolog', si: ['cancer', 'quimio', 'quimioterapia'] },
      { esp: 'peso|obesidad', si: ['adelgazar', 'peso', 'kilos', 'obesidad', 'sobrepeso'] },
      { esp: 'alimentarios', si: ['anorexia', 'bulimia', 'atracones', 'tca'], peso: 50 },
    ],
    dice: ['come fatal|7', 'come mal|7', 'comer mejor|6', 'no come verdura|7', 'come poco|5', 'nutricionista|9', 'dietista|9', 'nutricion|7', 'dieta|5', 'adelgazar|5', 'perder peso|6', 'bajar de peso|6',
      'kilos|4', 'obesidad|7', 'sobrepeso|6', 'comer sano|7', 'comer mas sano|7', 'alimentacion|5', 'vegano|4',
      'vegana|4', 'anorexia|9', 'bulimia|9', 'atracones|8', 'trastorno alimentario|9', 'trastornos alimentarios|9'] },
  { id: 'logopeda', nombre: 'logopeda', cat: 'logopedia', quien: 'que sea logopeda',
    esp: ['logoped'],
    refina: [
      { esp: 'infantil', si: ['hijo', 'hija', 'nino', 'nina', 'peque', 'infantil', 'anos'], peso: 25 },
      { esp: 'voz', si: ['voz', 'afonica', 'afonico', 'afonia', 'ronquera', 'cantante', 'cantar', 'dar clase'] },
      { esp: 'tartamudez', si: ['tartamudea', 'tartamudez', 'tartamudo', 'tartamuda'] },
      { esp: 'tea', si: ['autismo', 'tea', 'autista'] },
      { esp: 'neurolog', si: ['ictus', 'parkinson', 'afasia', 'neurologico'] },
      { esp: 'disfagia', si: ['tragar', 'disfagia', 'atraganta'] },
      { esp: 'biling', si: ['bilingue', 'dos idiomas'] },
      { esp: 'adultos', si: ['adulto', 'adultos', 'padre', 'madre'], peso: 25 },
    ],
    dice: ['tartamudeo|9', 'tartamudear|9', 'tartamudo|9', 'tartamuda|9', 'atraganta|8', 'se atraganta|9', 'dice * en vez de|8', 'pronuncia mal|9', 'no dice bien|8', 'cambia letras|8', 'cambia las letras|8', 'habla muy poco|8', 'habla poco|7', 'logopeda|10', 'logopedia|10', 'logopeta|10', 'pronuncia|6', 'pronunciar|6', 'no pronuncia|8', 'la r|4',
      'la erre|6', 'habla|3', 'no habla|6', 'lenguaje|5', 'tartamudea|9', 'tartamudez|9', 'afonica|7', 'afonico|7',
      'afonia|7', 'ronquera|6', 'voz|3', 'tragar|6', 'disfagia|9', 'dislalia|9', 'afasia|8', 'retraso del lenguaje|9'] },
  { id: 'terapeuta_ocupacional', nombre: 'terapeuta ocupacional', cat: 'salud', quien: 'que sea terapeuta ocupacional',
    esp: ['ocupacional'],
    dice: ['terapeuta ocupacional|10', 'terapia ocupacional|10'] },

  // ── Deporte ────────────────────────────────────────────────────────
  { id: 'entrenador', nombre: 'entrenador personal', cat: 'entrenador', quien: 'que sea entrenador personal',
    esp: ['entrenador', 'entrenamiento', 'musculaci', 'crossfit', 'funcional', 'deporte adaptado'],
    refina: [
      { esp: 'mayores|adaptado', si: ['mayor', 'mayores', 'abuelo', 'abuela', 'anciano', 'jubilado', 'discapacidad'] },
      { esp: 'musculaci', si: ['musculo', 'musculacion', 'masa muscular', 'pesas', 'volumen'] },
      { esp: 'crossfit|funcional', si: ['crossfit', 'funcional'] },
      { esp: 'domicilio', si: ['casa', 'domicilio'], peso: 25 },
    ],
    dice: ['entrenador personal|10', 'entrenadora personal|10', 'entrenador|8', 'entrenadora|8', 'entrenar|5',
      'entrenamiento|6', 'ponerme en forma|8', 'ponerse en forma|8', 'en forma|5', 'gimnasio|5', 'gym|5', 'ejercicio|4',
      'musculacion|8', 'ganar musculo|8', 'pesas|5', 'crossfit|8', 'perder peso|2', 'ponerme fuerte|6'] },
  { id: 'yoga', nombre: 'profesor de yoga', cat: 'entrenador', quien: 'que enseñe yoga',
    esp: ['yoga'], dice: ['yoga|10'] },
  { id: 'pilates', nombre: 'profesor de pilates', cat: 'entrenador', quien: 'que enseñe pilates',
    esp: ['pilates'], dice: ['pilates|10'] },
  { id: 'natacion', nombre: 'profesor de natación', cat: 'entrenador', quien: 'que enseñe natación',
    esp: ['nataci'], dice: ['nadar|8', 'natacion|9', 'piscina|3', 'aprender a nadar|10'] },
  { id: 'running', nombre: 'entrenador de running', cat: 'entrenador', quien: 'que entrene running',
    esp: ['running', 'trail'], parecidos: ['entrenador'],
    dice: ['correr|6', 'running|9', 'maraton|8', 'media maraton|9', 'trail|7', 'carrera|3', 'carreras|3', '10k|6'] },
  { id: 'padel', nombre: 'monitor de pádel', cat: 'entrenador', quien: 'que enseñe pádel',
    esp: ['p_del'], parecidos: ['entrenador'], dice: ['padel|10', 'tenis|4'] },

  // ── Clases ─────────────────────────────────────────────────────────
  { id: 'matematicas', nombre: 'profesor de matemáticas', cat: 'clases', quien: 'que dé clases de matemáticas',
    esp: ['matem_tic'], dice: ['matematicas|9', 'mates|8', 'algebra|8', 'calculo|6', 'estadistica|6', 'ecuaciones|7'] },
  { id: 'fisica', nombre: 'profesor de física y química', cat: 'clases', quien: 'que dé clases de física o química',
    esp: ['f_sica', 'qu_mica'], dice: ['fisica|8', 'quimica|8', 'formulacion|6'] },
  { id: 'ingles', nombre: 'profesor de inglés', cat: 'clases', quien: 'que dé clases de inglés',
    esp: ['ingl_s'], dice: ['ingles|8', 'english|8', 'first certificate|9', 'cambridge|6', 'toefl|8', 'ielts|8'] },
  { id: 'aleman', nombre: 'profesor de alemán', cat: 'clases', quien: 'que dé clases de alemán',
    esp: ['alem_n'], dice: ['aleman|9'] },
  { id: 'frances', nombre: 'profesor de francés', cat: 'clases', quien: 'que dé clases de francés',
    esp: ['franc_s'], dice: ['frances|9'] },
  { id: 'chino', nombre: 'profesor de chino', cat: 'clases', quien: 'que dé clases de chino',
    esp: ['chino mandar'], dice: ['chino|6', 'mandarin|9', 'clases de chino|10'] },
  { id: 'lengua', nombre: 'profesor de lengua', cat: 'clases', quien: 'que dé clases de lengua',
    esp: ['lengua y lit'],
    dice: ['lengua|6', 'literatura|7', 'sintaxis|8', 'comentario de texto|8', 'ortografia|6', 'redaccion|3',
      'lengua castellana|9'] },
  { id: 'historia', nombre: 'profesor de historia', cat: 'clases', quien: 'que dé clases de historia',
    esp: ['historia'], dice: ['historia|7', 'geografia|6', 'ciencias sociales|8'] },
  { id: 'biologia', nombre: 'profesor de biología', cat: 'clases', quien: 'que dé clases de biología',
    esp: ['biolog'], dice: ['biologia|8', 'geologia|8', 'ciencias naturales|7'] },
  { id: 'dibujo', nombre: 'profesor de dibujo', cat: 'clases', quien: 'que dé clases de dibujo',
    esp: ['dibujo'], dice: ['dibujo|8', 'dibujar|8', 'clases de pintura|9', 'pintura artistica|9', 'acuarela|8', 'arte|3'] },
  { id: 'piano', nombre: 'profesor de piano', cat: 'clases', quien: 'que dé clases de piano',
    esp: ['piano'], dice: ['piano|10', 'solfeo|8', 'lenguaje musical|8'] },
  { id: 'guitarra', nombre: 'profesor de guitarra', cat: 'clases', quien: 'que dé clases de guitarra',
    esp: ['guitarra'], dice: ['guitarra|10'] },
  { id: 'programacion', nombre: 'profesor de programación', cat: 'clases', quien: 'que enseñe programación',
    esp: ['programaci'], dice: ['programar|8', 'programacion|8', 'python|9', 'javascript|9', 'aprender a programar|10'] },
  { id: 'selectividad', nombre: 'preparador de selectividad', cat: 'clases', quien: 'que prepare la selectividad',
    esp: ['ebau', 'selectividad'], dice: ['selectividad|9', 'ebau|9', 'evau|9', 'pau|6', 'acceso a la universidad|9'] },
  { id: 'oposiciones', nombre: 'preparador de oposiciones', cat: 'clases', quien: 'que prepare oposiciones',
    esp: ['oposiciones'], dice: ['oposiciones|10', 'opositar|10', 'oposicion|6'] },

  // ── Leyes y papeles ────────────────────────────────────────────────
  { id: 'abogado_familia', nombre: 'abogado de familia', cat: 'legal', quien: 'que sea abogado de familia',
    esp: ['abogad_ de familia'],
    dice: ['pension|6', 'pension de mis hijos|10', 'no me pagan la pension|10', 'mis hijos|1', 'divorcio|9', 'divorciar|9', 'divorciarme|9', 'separacion|6', 'separarme|7', 'custodia|8',
      'pension alimenticia|9', 'regimen de visitas|9', 'abogado de familia|10'] },
  { id: 'laboralista', nombre: 'abogado laboralista', cat: 'legal', quien: 'que sea abogado laboralista',
    esp: ['laboralista'],
    dice: ['despedir|9', 'baja laboral|6', 'de baja|4', 'la empresa|3', 'mi jefe|3', 'no me pagan el sueldo|9', 'nomina|3', 'despido|9', 'despedido|9', 'despedida|6', 'me han despedido|10', 'finiquito|9', 'laboralista|10', 'ere|6',
      'contrato de trabajo|7', 'horas extra|6', 'acoso laboral|9'] },
  { id: 'extranjeria', nombre: 'abogado de extranjería', cat: 'legal', quien: 'que lleve extranjería',
    esp: ['extranjer'],
    dice: ['papeles|6', 'extranjeria|10', 'nie|7', 'arraigo|10', 'nacionalidad|9', 'permiso de trabajo|9',
      'permiso de residencia|10', 'tarjeta de residencia|10', 'visado|8', 'asilo|8', 'regularizar|8',
      'papeles para la residencia|10'] },
  { id: 'arrendamientos', nombre: 'abogado de alquileres', cat: 'legal', quien: 'que lleve alquileres',
    esp: ['arrendamiento'],
    dice: ['casero|9', 'casera|9', 'fianza|9', 'alquiler|6', 'inquilino|8', 'inquilina|8', 'desahucio|9', 'okupas|9',
      'contrato de alquiler|9', 'propietario|4'] },
  { id: 'herencias', nombre: 'abogado de herencias', cat: 'legal', quien: 'que lleve herencias',
    esp: ['herencia'],
    dice: ['herencia|10', 'heredar|10', 'herede|10', 'testamento|9', 'sucesion|8', 'albacea|9'] },
  { id: 'penal', nombre: 'abogado penalista', cat: 'legal', quien: 'que sea abogado penalista',
    esp: ['penal'],
    dice: ['denunciado|8', 'denunciada|8', 'me han denunciado|10', 'me ha denunciado|10', 'estafa|7', 'me han robado|6', 'agresion|7', 'penal|9', 'penalista|10', 'denuncia|5', 'denunciar|5', 'delito|8', 'detenido|9', 'antecedentes|6', 'juicio|3'] },
  { id: 'administrativo', nombre: 'abogado administrativista', cat: 'legal', quien: 'que recurra multas y sanciones',
    esp: ['abogado administrativo'],
    dice: ['multa|9', 'multas|9', 'sancion|8', 'recurso|4', 'recurrir|6', 'ayuntamiento|4', 'administracion|3'] },
  { id: 'mercantil', nombre: 'abogado mercantil', cat: 'legal', quien: 'que sea abogado mercantil',
    esp: ['mercantil'],
    dice: ['mercantil|10', 'montar una empresa|8', 'crear una empresa|8', 'crear una sociedad|9', 'sociedad limitada|9',
      'startup|8', 'socios|6', 'estatutos|8', 'empresa|2'] },
  { id: 'gestor', nombre: 'gestor', cat: 'legal', quien: 'que sea gestor o asesor fiscal',
    esp: ['gestor', 'fiscal', 'contable', 'financier'],
    refina: [
      { esp: 'fiscal', si: ['renta', 'impuestos', 'hacienda', 'iva', 'fiscal'] },
      { esp: 'contable', si: ['contabilidad', 'facturas', 'cuentas'] },
      { esp: 'financier', si: ['invertir', 'inversion', 'ahorro', 'ahorrar', 'finanzas'] },
      { esp: 'gestor', si: ['tramite', 'tramites', 'papeleo', 'autonomo'] },
    ],
    dice: ['renta|6', 'declaracion de la renta|10', 'hacienda|8', 'impuestos|8', 'autonomo|7', 'alta de autonomo|10',
      'darme de alta|6', 'iva|7', 'facturas|5', 'contabilidad|9', 'contable|9', 'gestoria|10', 'gestor|8', 'gestora|8',
      'nomina|6', 'nominas|6', 'asesor fiscal|10', 'invertir|6', 'inversiones|6', 'finanzas|6', 'tramites|4', 'papeleo|5'] },

  // ── Diseño, web y tecnología ───────────────────────────────────────
  { id: 'grafico', nombre: 'diseñador gráfico', cat: 'diseno', quien: 'que sea diseñador gráfico',
    esp: ['gr_fic'],
    dice: ['logo|8', 'logotipo|9', 'branding|9', 'identidad visual|9', 'diseno grafico|10', 'disenador grafico|10',
      'cartel|6', 'flyer|7', 'tarjetas de visita|8', 'folleto|6'] },
  { id: 'web', nombre: 'diseñador web', cat: 'tecnologia', quien: 'que haga páginas web',
    esp: ['dise_ador web', 'dise_adora web', 'desarrollador web'],
    dice: ['pagina web|9', 'web|5', 'tienda online|9', 'wordpress|9', 'landing|8', 'ecommerce|9', 'shopify|9',
      'dominio|4', 'mi web|6'] },
  { id: 'apps', nombre: 'desarrollador de apps', cat: 'tecnologia', quien: 'que desarrolle apps',
    esp: ['apps'], parecidos: ['web'],
    dice: ['app|6', 'una app|8', 'aplicacion|4', 'aplicacion movil|9', 'aplicacion para el movil|9', 'desarrollar una app|10'] },
  { id: 'ux', nombre: 'diseñador UX/UI', cat: 'diseno', quien: 'que diseñe UX/UI',
    esp: ['ux'], dice: ['ux|9', 'ui|6', 'usabilidad|8', 'experiencia de usuario|9', 'prototipo|5', 'figma|8'] },
  { id: 'fotografo', nombre: 'fotógrafo', cat: 'diseno', quien: 'que sea fotógrafo',
    esp: ['fot_graf'],
    refina: [{ esp: 'eventos', si: ['boda', 'evento', 'comunion', 'bautizo', 'fiesta'] }],
    dice: ['fotografo|10', 'fotografa|10', 'fotografia|8', 'fotos|4', 'sesion de fotos|10', 'reportaje|6', 'book|5'] },
  { id: 'video', nombre: 'videógrafo', cat: 'diseno', quien: 'que grabe y edite vídeo',
    esp: ['v_deo', 'videogr'],
    dice: ['video|6', 'videos|6', 'grabar|4', 'edicion de video|10', 'editar video|10', 'editar un video|10', 'youtube|6',
      'videografo|10', 'montaje de video|10'] },
  { id: 'community', nombre: 'community manager', cat: 'diseno', quien: 'que lleve redes sociales',
    esp: ['community'],
    dice: ['redes sociales|9', 'instagram|8', 'community manager|10', 'tiktok|8', 'publicaciones|4', 'redes|4'] },
  { id: 'seo', nombre: 'especialista en SEO y marketing', cat: 'diseno', quien: 'que haga SEO o marketing',
    esp: ['seo', 'marketing'],
    dice: ['salir primero en google|10', 'primero en google|10', 'en google|6', 'aparecer en google|10', 'seo|10', 'posicionar|7', 'posicionamiento|8', 'google|4', 'marketing|6', 'anuncios|4', 'publicidad|5',
      'mas clientes|5', 'salir en google|9', 'posicionar * web|12'] },
  { id: 'copywriter', nombre: 'copywriter', cat: 'diseno', quien: 'que escriba textos',
    esp: ['copywriter'],
    dice: ['copywriter|10', 'textos|6', 'redactar|6', 'escribir los textos|9', 'newsletter|7'] },
  { id: 'ia', nombre: 'especialista en IA', cat: 'tecnologia', quien: 'que sea especialista en IA',
    esp: ['especialista en ia'],
    dice: ['inteligencia artificial|10', 'chatgpt|9', 'ia|6', 'automatizar|5', 'automatizacion|5'] },

  // ── Eventos ────────────────────────────────────────────────────────
  { id: 'mago', nombre: 'mago', cat: 'eventos', quien: 'que haga magia',
    esp: ['mago'], parecidos: ['animacion'], dice: ['mago|10', 'maga|10', 'magia|8', 'trucos de magia|10'] },
  { id: 'dj', nombre: 'DJ', cat: 'eventos', quien: 'que sea DJ',
    esp: ['dj'], dice: ['dj|10', 'pinchadiscos|10', 'musica para una fiesta|9', 'musica para la boda|9'] },
  { id: 'wedding', nombre: 'wedding planner', cat: 'eventos', quien: 'que organice bodas',
    esp: ['wedding'],
    dice: ['wedding planner|10', 'organizar mi boda|10', 'organizar la boda|10', 'organizar una boda|10', 'organizar * boda|9'] },
  { id: 'animacion', nombre: 'animador infantil', cat: 'eventos', quien: 'que haga animación infantil',
    esp: ['animador'],
    dice: ['animacion|6', 'animador|9', 'animadora|9', 'fiesta infantil|8', 'cumpleanos infantil|8', 'payaso|8',
      'fiesta de mi hija|6', 'fiesta de mi hijo|6', 'cumpleanos de mi hijo|6', 'cumpleanos de mi hija|6'] },
  { id: 'decorador_eventos', nombre: 'decorador de eventos', cat: 'eventos', quien: 'que decore eventos',
    esp: ['decorador de eventos'],
    dice: ['decorar la fiesta|9', 'decoracion de la boda|9', 'decoracion de la fiesta|9', 'globos|6', 'decorar el evento|9'] },

  // ── Coche ──────────────────────────────────────────────────────────
  { id: 'mecanico', nombre: 'mecánico', cat: 'automocion', quien: 'que sea mecánico',
    esp: ['mec_nic'],
    dice: ['mecanico|10', 'coche|4', 'moto|4', 'ruido raro|3', 'taller|6', 'frenos|7', 'embrague|8', 'cambiar el aceite|9',
      'itv|8', 'revision del coche|9', 'motor|4', 'ruedas|3', 'neumaticos|6', 'pinchazo|5'] },
  { id: 'electricidad_auto', nombre: 'electricista del automóvil', cat: 'automocion', quien: 'que arregle la electricidad del coche',
    esp: ['electricidad del autom'], parecidos: ['mecanico'],
    dice: ['bateria del coche|10', 'luces del coche|10', 'el coche no arranca|9', 'bateria de la moto|10', 'alternador|9'] },
  { id: 'lavado_coche', nombre: 'limpieza de coches', cat: 'automocion', quien: 'que limpie coches',
    esp: ['limpieza de veh', 'detailing'],
    dice: ['limpiar el coche|10', 'lavar el coche|10', 'detailing|10', 'tapiceria del coche|10', 'pulir el coche|10',
      'limpiar la moto|10'] },

  // ── Idiomas ────────────────────────────────────────────────────────
  { id: 'traductor', nombre: 'traductor', cat: 'idiomas', quien: 'que traduzca',
    esp: ['traduct'],
    refina: [{ esp: 'arabe', si: ['arabe'] }, { esp: 'chino', si: ['chino', 'mandarin'] }],
    dice: ['traducir|9', 'traduccion|9', 'traductor|10', 'traductora|10', 'traduccion jurada|10', 'traduzca|9'] },
  { id: 'interprete', nombre: 'intérprete', cat: 'idiomas', quien: 'que haga de intérprete',
    esp: ['int_rprete'], parecidos: ['traductor'],
    dice: ['interprete|10', 'interpretar|6', 'reunion con|3'] },
  { id: 'guia', nombre: 'guía turístico', cat: 'idiomas', quien: 'que haga de guía',
    esp: ['gu_a tur'],
    dice: ['una guia|8', 'un guia|8', 'guia|6', 'guia turistico|10', 'guia turistica|10', 'visita guiada|10', 'tour|7', 'ensenar la ciudad|9',
      'ensenar barcelona|9', 'turismo|5'] },
]

// ── Lectura de la frase ─────────────────────────────────────────────────

export const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9ñ\s]/g, ' ').replace(/ñ/g, 'n').replace(/\s+/g, ' ').trim()

const escapar = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function aRegex(frase) {
  // Plural dentro de la frase: «comentarios de texto» vale por «comentario de texto».
  const partes = frase.split(' * ').map(p => p.split(' ').map(w => escapar(w) + (w.length > 3 ? 's?' : '')).join(' '))
  // Plurales: «altavoz»→«altavoces» ya está; aquí basta s/es al final.
  const cuerpo = partes.join('(?: [a-z0-9]+){0,4} ')
  return new RegExp(`(?:^| )${cuerpo}(?:s|es)?(?= |$)`)
}

const INDICE = OFICIOS.map(o => ({
  o,
  // `*` se conserva: normalizar lo borraría.
  dice: o.dice.map(d => { const [f, p] = d.split('|'); return { re: aRegex(f.split(' * ').map(normalizar).join(' * ')), peso: Number(p || 3), f } }),
  // La especialidad de la ficha: los patrones `_` valen por una letra.
  esp: new RegExp(o.esp.map(p => normalizar(p.replace(/_/g, 'QQ')).replace(/qq/g, '.')).map(p => p.split('.').map(escapar).join('.')).join('|')),
  requiere: (o.requiere || []).map(r => aRegex(normalizar(r))),
  refina: (o.refina || []).map(r => ({ esp: new RegExp(r.esp), si: r.si.map(s => aRegex(normalizar(s))), peso: r.peso ?? 40 })),
}))
const POR_ID = Object.fromEntries(INDICE.map(x => [x.o.id, x]))

export const oficio = id => POR_ID[id]?.o || null

/**
 * Los oficios que pide una frase, del más claro al menos: [{ id, puntos }].
 * Solo los que se acercan al primero (la mitad de sus puntos o más).
 */
export function oficiosDe(texto) {
  // «que hable inglés» es un requisito de la persona (lo mira lo declarado),
  // no el oficio: «una guía que hable inglés» no pide clases de inglés.
  const t = normalizar(texto).replace(/\b(que )?(hable|hablen|habla|sepa|sepan) (en )?(ingles|frances|aleman|catalan|castellano|espanol|chino|arabe|italiano|portugues|ruso)\b/g, ' ')
  if (!t.trim()) return []
  const puntos = []
  for (const x of INDICE) {
    if (x.requiere.length && !x.requiere.some(r => r.test(t))) continue
    let p = 0
    for (const d of x.dice) if (d.re.test(t)) p += d.peso
    if (p >= 3) puntos.push({ id: x.o.id, puntos: p })
  }
  puntos.sort((a, b) => b.puntos - a.puntos)
  if (!puntos.length) return []
  const tope = puntos[0].puntos
  return puntos.filter(x => x.puntos >= tope / 2).slice(0, 3)
}

/** ¿Esta especialidad es de este oficio? */
export function esDelOficio(especialidad, id) {
  const x = POR_ID[id]
  return Boolean(x && x.esp.test(normalizar(especialidad)))
}

/** Puntos por especialidad concreta dentro del oficio, según la frase. */
export function puntosRefina(especialidad, id, texto) {
  const x = POR_ID[id]
  if (!x?.refina.length) return 0
  const e = normalizar(especialidad), t = normalizar(texto)
  let p = 0
  for (const r of x.refina) if (r.esp.test(e) && r.si.some(s => s.test(t))) p += r.peso
  return p
}

/** Patrones para pedir a la base las fichas de estos oficios (ilike, sin tildes). */
export function patronesDe(ids) {
  return [...new Set(ids.flatMap(id => POR_ID[id]?.o.esp || []))]
}
