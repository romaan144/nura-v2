import { useTitulo } from '../utils/titulo'
import { useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import styles from './Siguiendo.module.css'
import { CONTACTO_EMAIL } from '../config'

// ── PRIVACIDAD Y TÉRMINOS ──────────────────────────────────────────────
//
// Etapa 3 de docs/estudio-perfil.md. Nüra no tenia ningun texto legal, y
// para operar en España con datos personales tiene que tenerlos.
//
// ESTO ES UN BORRADOR, y lo dice en pantalla. Lo redacto a partir de lo que
// la app hace DE VERDAD (lo que guarda y donde), sin inventar lo que no se
// sabe: el nombre y el NIF del responsable, el correo de contacto y donde
// estan los servidores quedan entre corchetes. Lo tiene que revisar alguien
// con criterio juridico antes de lanzar.

const DOCS = {
  privacidad: {
    titulo: 'Privacidad',
    secciones: [
      ['Quién trata tus datos', 'El responsable es [nombre del responsable], con NIF [NIF] y domicilio en [domicilio].'],
      ['Qué datos guardamos',
        'Si buscas ayuda: tu nombre, tu teléfono, lo que buscas y las conversaciones que empiezas. Se guardan en tu propio móvil.\n\n' +
        'Si eres profesional: además, tu ficha (nombre, especialidad, formación, zona, tarifa y cómo contactarte). Tu ficha es pública, porque su función es que te encuentren.\n\n' +
        'Cuando escribes a un profesional, guardamos el mensaje para poder avisarle.\n\n' +
        'Si pides «Te aviso si aparece», guardamos tu correo y, si lo aceptas, el permiso de avisos de tu navegador, solo para ese aviso. Si pides «Avísame cuando conteste», guardamos ese permiso en tu conversación solo hasta que te contesten; entonces se usa una vez y se borra. Si eres profesional y pides «Avísame cuando me escriban», guardamos el permiso de avisos de tu móvil hasta que lo quites. Puedes quitarlo cuando quieras desde el propio correo o desde tu perfil.\n\n' +
        'Si valoras a un profesional, guardamos tu valoración. En su ficha solo se publica el resumen de todas, nunca quién las ha dejado.\n\n' +
        'Para saber si Nüra funciona contamos cosas sueltas y sin tu texto: que hubo una búsqueda de un tipo de servicio (por ejemplo «limpieza»), que se enseñó una ficha o que alguien escribió a un profesional.'],
      ['Lo que nunca hacemos', 'No analizamos tus conversaciones ni lo que escribes al buscar para sacar conclusiones sobre ti o sobre nadie. Lo que aparece en la ficha de un profesional sale de lo que pasa en Nüra (por ejemplo, cuánto tarda en contestar), de las valoraciones y de lo que él mismo declara, siempre con su prueba.'],
      ['Para qué', 'Para ponerte en contacto con la persona que puede ayudarte, y para que los profesionales reciban los avisos de quien les escribe. No vendemos tus datos ni los usamos para publicidad.'],
      ['Dónde', 'Lo que se guarda en tu móvil no sale de él. La ficha de los profesionales, los avisos, las valoraciones y los «Te aviso si aparece» se guardan en los servidores de Supabase, en [región de los servidores].\n\n' +
        'Otros servicios que usamos, solo para lo necesario: Resend envía los correos de aviso; tu navegador (Google, Apple o Mozilla) entrega las notificaciones, sin su contenido; y si un profesional lo pide, Anthropic (Claude) ordena el texto que ha escrito sobre sí mismo para que él lo revise. Ese texto no se usa para entrenar a la IA.'],
      ['Tus derechos', 'Puedes pedir ver, corregir o borrar tus datos, oponerte a que los tratemos, limitar su uso o llevártelos. Escríbenos a [correo de contacto]. Si no te respondemos bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).'],
      ['Borrar tus datos', 'Desde tu perfil, en Ajustes, puedes borrarlo todo al momento. Sin acceso, se borra lo que Nüra guarda en tu teléfono. Con acceso, «Borrar mi cuenta» elimina además tu cuenta, tu ficha pública, los mensajes que te han llegado, tus valoraciones y tus avisos.'],
    ],
  },
  terminos: {
    titulo: 'Términos de uso',
    secciones: [
      ['Qué es Nüra', 'Nüra te ayuda a encontrar personas reales que pueden ayudarte. Nüra no presta los servicios: los presta cada profesional, que es responsable de su trabajo.'],
      ['Lo que Nüra comprueba', 'Nüra ordena y recomienda profesionales según lo que cuentas. Una recomendación no es una garantía: antes de contratar, habla con la persona y decide tú.'],
      ['Usar Nüra con respeto', 'No se puede usar Nüra para engañar, acosar o suplantar a nadie, ni para publicar contenido falso o ilegal. Podemos retirar las fichas o mensajes que lo hagan.'],
      ['Profesionales', 'Si te das de alta como profesional, lo que pones en tu ficha tiene que ser verdad. Tú fijas tu precio y tus condiciones con cada persona.'],
      ['Contacto', 'Para cualquier duda sobre estos términos: [correo de contacto].'],
    ],
  },
}

export default function Legal() {
  const { doc } = useParams()
  const d = DOCS[doc] || DOCS.privacidad
  useTitulo(d.titulo)
  const conCorreo = t => CONTACTO_EMAIL ? t.replaceAll('[correo de contacto]', CONTACTO_EMAIL) : t
  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h1 className={styles.title}>{d.titulo}</h1>
        <p style={{ margin: '0 0 var(--space-20)', fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', lineHeight: 1.5 }}>
          Versión provisional, pendiente de revisión legal.
        </p>
        {d.secciones.map(([h, t]) => (
          <section key={h} style={{ marginBottom: 'var(--space-20)' }}>
            <h2 style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-base)', fontWeight: 700,
              color: 'var(--ink-primary)', letterSpacing: '-0.2px' }}>{h}</h2>
            {conCorreo(t).split('\n\n').map((par, i) => (
              <p key={i} style={{ margin: '0 0 var(--space-8)', fontSize: 'var(--text-base)',
                color: 'var(--ink-secondary)', lineHeight: 1.55 }}>{par}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
