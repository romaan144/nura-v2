import { CircleAlert } from 'lucide-react'
import EmptyPanel from './EmptyPanel'

// Se anuncia el mensaje; los botones quedan fuera de la zona de alerta.
export default function ErrorPanel(props) {
  return <EmptyPanel icon={CircleAlert} tone="error" messageRole="alert" {...props} />
}
