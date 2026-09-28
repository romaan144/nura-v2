import PageHeader from './PageHeader'
import styles from './PageLoading.module.css'

const labels = {
  helper: 'Cargando perfil…',
  profile: 'Cargando tu perfil…',
  chat: 'Abriendo conversación…',
  chats: 'Cargando conversaciones…',
}

// Misma espera para la descarga de la pantalla y la consulta de sus datos.
// No contiene datos ficticios, controles falsos ni temporizadores de espera.
export default function PageLoading({ kind }) {
  const chat = kind === 'chat'
  const profile = kind === 'helper' || kind === 'profile'
  return (
    <div className={`${styles.page} ${chat ? styles.chat : ''}`}>
      <PageHeader showBack={kind === 'helper' || chat} />
      <div className={styles.content}>
        {kind === 'chats' && <h1 className={styles.title}>Tus conversaciones</h1>}
        <p className={styles.status} role="status">{labels[kind]}</p>
        <div className={styles.placeholders} aria-hidden="true">
          {profile ? <>
            <div className={styles.profile}>
              <div className={styles.cover} />
              <div className={`${styles.shape} ${styles.portrait}`} />
              <div className={`${styles.shape} ${styles.name}`} />
              <div className={`${styles.shape} ${styles.subtitle}`} />
              <div className={styles.lines}><i /><i /><i /></div>
            </div>
            <div className={styles.panel}><div className={styles.lines}><i /><i /><i /></div></div>
          </> : chat ? <>
            <div className={styles.person}><div className={`${styles.shape} ${styles.avatar}`} /><div className={styles.lines}><i /><i /></div></div>
            <div className={styles.chatSpace}><span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} /></div>
            <div className={styles.composer} />
          </> : <>
            <div className={styles.search} />
            {[0, 1, 2].map(i => <div className={styles.person} key={i}><div className={`${styles.shape} ${styles.avatar}`} /><div className={styles.lines}><i /><i /><i /></div></div>)}
          </>}
        </div>
      </div>
    </div>
  )
}
