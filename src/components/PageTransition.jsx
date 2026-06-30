import { useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import styles from './PageTransition.module.css'

export default function PageTransition({ children }) {
  const location = useLocation()
  const [display, setDisplay] = useState(children)
  const [phase, setPhase] = useState('idle') // idle | out | in
  const prevRef = useRef(location.key)

  useEffect(() => {
    if (location.key === prevRef.current) return
    prevRef.current = location.key
    setPhase('in')
    const t = setTimeout(() => setPhase('idle'), 320)
    return () => clearTimeout(t)
  }, [location.key])

  useEffect(() => { setDisplay(children) }, [children])

  return (
    <div className={`${styles.wrap} ${phase === 'in' ? styles.animIn : ''}`}>
      {display}
    </div>
  )
}
