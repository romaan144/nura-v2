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
            background:'rgba(123,47,255,0.10)', display:'flex',
            alignItems:'center', justifyContent:'center', fontSize:'24px'
          }}>🤍</div>
          <div>
            <p style={{fontSize:'16px',fontWeight:700,color:'var(--ink, #1a1a1a)',marginBottom:'6px'}}>
              Algo fue mal por mi lado
            </p>
            <p style={{fontSize:'13px',color:'rgba(0,0,0,0.5)',lineHeight:1.5,maxWidth:'280px'}}>
              Dame un segundo e inténtalo de nuevo. Si sigue pasando, vuelve atrás y prueba otra vez.
            </p>
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
            <button onClick={() => window.history.back()}
              style={{padding:'11px 22px',background:'white',color:'var(--ink, #1a1a1a)',border:'1px solid rgba(0,0,0,0.12)',borderRadius:'14px',fontSize:'14px',fontWeight:600}}>
              Volver
            </button>
            <button onClick={() => window.location.reload()}
              style={{padding:'11px 22px',background:'var(--purple, #7B2FFF)',color:'white',border:'none',borderRadius:'14px',fontSize:'14px',fontWeight:600}}>
              Reintentar
            </button>
          </div>
          <button onClick={() => this.setState({ showDetail: !this.state.showDetail })}
            style={{marginTop:'8px',fontSize:'11px',color:'rgba(0,0,0,0.3)',background:'none',border:'none'}}>
            {this.state.showDetail ? 'Ocultar detalle técnico' : 'Detalle técnico'}
          </button>
          {this.state.showDetail && (
            <p style={{color:'#991B1B',fontSize:'11px',fontFamily:'monospace',background:'white',padding:'12px',borderRadius:'8px',whiteSpace:'pre-wrap',maxWidth:'320px',textAlign:'left'}}>
              {this.state.error.message}
            </p>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
