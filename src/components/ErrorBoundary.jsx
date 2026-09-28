import ErrorPanel from './ErrorPanel'
import styles from './ErrorPanel.module.css'
import { Component } from 'react'
import { esVersionVieja, recargarPorVersionNueva } from '../utils/versionNueva'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, showDetail: false }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error) {
    // Versión nueva publicada con la app abierta: se recarga sola.
    if (esVersionVieja(error) && recargarPorVersionNueva()) this.setState({ recargando: true })
  }
  render() {
    if (this.state.recargando) return null
    if (this.state.error) {
      return (
        <div className={styles.frame}>
          <ErrorPanel
            title="No he podido mostrar esta pantalla"
            hint="Puedes volver a cargarla. Si el problema continúa, vuelve a la pantalla anterior."
            actionLabel="Reintentar"
            onAction={() => window.location.reload()}
            secondaryLabel="Volver"
            onSecondary={() => window.history.back()}
          >
            <div className={styles.details}>
              <button type="button" className={styles.detailButton}
                aria-expanded={this.state.showDetail}
                onClick={() => this.setState({ showDetail: !this.state.showDetail })}>
                {this.state.showDetail ? 'Ocultar detalle técnico' : 'Detalle técnico'}
              </button>
              {this.state.showDetail && <p className={styles.detailText}>{this.state.error.message}</p>}
            </div>
          </ErrorPanel>
        </div>
      )
    }
    return this.props.children
  }
}
