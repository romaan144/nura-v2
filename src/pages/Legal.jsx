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
        'Cuando escribes a un profesional, guardamos el mensaje para poder avisarle.'],
      ['Para qué', 'Para ponerte en contacto con la persona que puede ayudarte, y para que los profesionales reciban los avisos de quien les escribe. No vendemos tus datos ni los usamos para publicidad.'],
      ['Dónde', 'Lo que se guarda en tu móvil no sale de él. La ficha de los profesionales y los avisos se guardan en los servidores de Supabase, en [región de los servidores].'],
      ['Tus derechos', 'Puedes pedir ver, corregir o borrar tus datos, oponerte a que los tratemos, limitar su uso o llevártelos. Escríbenos a [correo de contacto]. Si no te respondemos bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).'],
      ['Borrar tus datos', 'Desde tu perfil, en «Borrar mis datos de este móvil», eliminas al momento todo lo que Nüra guarda en tu teléfono. Para retirar una ficha profesional pública, escríbenos.'],
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
