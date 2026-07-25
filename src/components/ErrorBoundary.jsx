import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, showDetail: false }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding:'32px 24px', minHeight:'100dvh', display:'flex',
          flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:'16px', background:'var(--bg, #F8F8FA)', textAlign:'center'
        }}>
          <div style={{
            width:'56px', height:'56px', borderRadius:'50%',
            background:'var(--purple-10)', display:'flex',
            alignItems:'center', justifyContent:'center', fontSize:'24px'
          }}>🤍</div>
          <div>
            <p style={{fontSize:'var(--text-base)',fontWeight:700,color:'var(--ink, #1a1a1a)',marginBottom:'6px'}}>
              Algo fue mal por mi lado
            </p>
            <p style={{fontSize:'var(--text-sm)',color:'rgba(33,29,51,0.5)',lineHeight:1.5,maxWidth:'280px'}}>
              Dame un segundo e inténtalo de nuevo. Si sigue pasando, vuelve atrás y prueba otra vez.
            </p>
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
            <button onClick={() => window.history.back()}
              style={{padding:'11px 22px',background:'white',color:'var(--ink, #1a1a1a)',border:'1px solid rgba(33,29,51,0.12)',borderRadius:'var(--radius-card)',fontSize:'var(--text-sm)',fontWeight:600}}>
              Volver
            </button>
            <button onClick={() => window.location.reload()}
              style={{padding:'11px 22px',background:'var(--purple, var(--purple))',color:'white',border:'none',borderRadius:'var(--radius-card)',fontSize:'var(--text-sm)',fontWeight:600}}>
              Reintentar
            </button>
          </div>
          <button onClick={() => this.setState({ showDetail: !this.state.showDetail })}
            style={{marginTop:'8px',fontSize:'var(--text-xs)',color:'rgba(33,29,51,0.3)',background:'none',border:'none'}}>
            {this.state.showDetail ? 'Ocultar detalle técnico' : 'Detalle técnico'}
          </button>
          {this.state.showDetail && (
            <p style={{color:'#991B1B',fontSize:'var(--text-xs)',fontFamily:'monospace',background:'white',padding:'12px',borderRadius:'var(--radius-sm)',whiteSpace:'pre-wrap',maxWidth:'320px',textAlign:'left'}}>
              {this.state.error.message}
            </p>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
