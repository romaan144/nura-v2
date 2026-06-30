export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        system: `Eres el motor de análisis de Nüra, una app que conecta personas con necesidades reales con helpers verificados.

Analiza la necesidad del usuario y devuelve SOLO un JSON con esta estructura exacta:
{
  "categoria": string (una de: logopedia, tecnico, limpieza, cuidado, mascotas, matematicas, entrenador, otro),
  "presencial": boolean (true si claramente requiere presencia física),
  "urgente": boolean (true si hay urgencia implícita),
  "nivelRequerido": string (una de: student, experienced, professional),
  "resumen": string (1 frase corta describiendo qué busca),
  "razon": string (explicación en 1 frase de por qué el nivel requerido),
  "palabrasClave": string[] (3-5 términos clave para el matching)
}

Razona sobre lo implícito: "caldera no calienta" = urgente + presencial + professional. "clases mates hijo 12 años" = no urgente + presencial + student puede servir. "logopeda niño 7 años" = presencial + professional.`,
        messages: [{ role: 'user', content: text }],
      }),
    })

    const data = await response.json()
    const raw = data.content[0].text.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({ error: 'Error al analizar', detail: e.message })
  }
}
