import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{padding:'24px',fontFamily:'monospace',background:'var(--red-light)',minHeight:'100dvh'}}>
        <h2 style={{color:'#DC2626',fontSize:'16px'}}>Error de la aplicación</h2>
        <pre style={{fontSize:'var(--text-xs)',color:'#991B1B',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
          {this.state.error?.message}
          {'\n\n'}
          {this.state.error?.stack?.split('\n').slice(0,8).join('\n')}
        </pre>
        <button onClick={() => { localStorage.clear(); window.location.reload() }}
          style={{marginTop:'16px',padding:'10px 20px',background:'#DC2626',color:'white',border:'none',borderRadius:'8px',cursor:'pointer'}}>
          Limpiar caché y recargar
        </button>
      </div>
    )
    return this.props.children
  }
}
