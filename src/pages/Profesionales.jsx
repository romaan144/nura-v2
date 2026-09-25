// ── NÜRA PARA PROFESIONALES ──────────────────────────────────────────────
//
// La pagina que el fundador comparte (por WhatsApp, en persona) para que
// los primeros profesionales entiendan que es Nüra y se den de alta.
// Enlace: /profesionales. No pasa por la bienvenida (solo la raiz lo hace).
//
// REGLA: solo se promete lo que la app hace HOY. Ni cifras de clientes, ni
// «reciben X contactos al mes»: todavia no hay gente real, y es lo primero
// que un profesional comprobaria. Se dice que Nüra esta empezando, porque
// es verdad y porque a los primeros eso les interesa.

import { useNavigate } from 'react-router-dom'
import { MessageCircle, Sparkles, Bell, Star, ShieldCheck, EyeOff, PenLine, Share2, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { CAT_HUMANA } from '../data/categorias'
import { CONTACTO_EMAIL } from '../config'
import { showToast } from '../components/Toast'
import styles from './Profesionales.module.css'

const PASOS = [
  { icono: PenLine, titulo: 'Cuentas qué haces, con tus palabras',
    texto: 'Seis preguntas desde el móvil, unos 3 minutos. Sin descargar nada. Tú decides qué se publica y lo cambias cuando quieras.' },
  { icono: Sparkles, titulo: 'Alguien describe lo que necesita',
    texto: '«Mi hijo de 5 años no pronuncia la r.» Nüra lo entiende y, si encajas, te recomienda explicando por qué.' },
  { icono: Bell, titulo: 'Te llega su mensaje',
    texto: 'Al móvil o al correo, con un enlace. Contestas desde ahí: sin app, sin contraseña. Tu teléfono no se muestra a nadie.' },
  { icono: Star, titulo: 'Tu trabajo habla por ti',
    texto: 'Al terminar, tus clientes dicen cómo fue con un toque. Tu ficha lo enseña con su prueba: «Paciente · lo dicen 12 clientes».' },
]

const PROMESAS = [
  { icono: EyeOff, texto: 'Nunca analizamos tus conversaciones ni las usamos para nada más.' },
  { icono: ShieldCheck, texto: 'En tu ficha solo sale lo que tiene prueba, y ves y corriges todo lo que Nüra sabe de ti.' },
  { icono: MessageCircle, texto: 'Si no puedes atender a alguien, se lo dices con una frase. Nadie te pide explicaciones.' },
]

export default function Profesionales() {
  const navigate = useNavigate()

  async function compartir() {
    const url = window.location.origin + '/profesionales'
    const texto = 'Mira Nüra: conecta a gente que necesita ayuda con profesionales de Barcelona. Darse de alta es gratis.'
    try {
      if (navigator.share) { await navigator.share({ title: 'Nüra para profesionales', text: texto, url }); return }
      await navigator.clipboard.writeText(`${texto} ${url}`)
      showToast('Enlace copiado. Pégalo donde quieras.')
    } catch { /* cancelado por la persona: no pasa nada */ }
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <main className={styles.content}>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>Nüra para profesionales</p>
          <h1 className={styles.title}>Que te encuentre quien de verdad te necesita</h1>
          <p className={styles.lead}>
            La gente le cuenta a Nüra lo que le pasa, con sus palabras, y Nüra le presenta a la persona adecuada.
            Si eso eres tú, te llega su mensaje.
          </p>
          <button className={styles.cta} onClick={() => navigate('/register-helper')}>
            Crear mi ficha gratis <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p className={styles.nota}>Unos 3 minutos · Sin tarjeta · Sin descargar nada</p>
        </section>

        <section className={styles.seccion} aria-labelledby="como">
          <h2 id="como" className={styles.h2}>Cómo funciona</h2>
          <ol className={styles.pasos}>
            {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
              <li key={titulo} className={styles.paso}>
                <span className={styles.pasoIcono} aria-hidden="true"><Icono size={20} /></span>
                <div>
                  <p className={styles.pasoNum}>Paso {i + 1}</p>
                  <h3 className={styles.pasoTitulo}>{titulo}</h3>
                  <p className={styles.pasoTexto}>{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.seccion} aria-labelledby="oficios">
          <h2 id="oficios" className={styles.h2}>Para quién es</h2>
          <p className={styles.parrafo}>Para quien ayuda a otras personas, con título o con años de oficio:</p>
          <div className={styles.chips}>
            {Object.values(CAT_HUMANA).map(c => <span key={c} className={styles.chip}>{c}</span>)}
          </div>
        </section>

        <section className={styles.seccion} aria-labelledby="promesas">
          <h2 id="promesas" className={styles.h2}>Lo que Nüra no hace</h2>
          <ul className={styles.promesas}>
            {PROMESAS.map(({ icono: Icono, texto }) => (
              <li key={texto} className={styles.promesa}>
                <Icono size={18} aria-hidden="true" className={styles.promesaIcono} />
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.seccion} ${styles.empezando}`} aria-labelledby="empezando">
          <h2 id="empezando" className={styles.h2}>Estamos empezando</h2>
          <p className={styles.parrafo}>
            Nüra está naciendo en Barcelona y buscamos a los primeros profesionales. Quien entra ahora nos ayuda
            a darle forma: lo que nos digas cambia la app.
          </p>
          {CONTACTO_EMAIL && (
            <p className={styles.parrafo}>
              ¿Dudas? Escríbenos a <a className={styles.enlace} href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a>.
            </p>
          )}
        </section>

        <section className={styles.final}>
          <button className={styles.cta} onClick={() => navigate('/register-helper')}>
            Crear mi ficha gratis <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button className={styles.secundario} onClick={compartir}>
            <Share2 size={16} aria-hidden="true" /> Compartir con un compañero
          </button>
          <button className={styles.textoBoton} onClick={() => navigate('/entrar')}>
            ¿Ya tienes ficha? Entra
          </button>
        </section>
      </main>
    </div>
  )
}
