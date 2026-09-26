# Nüra · trabajo compartido

Leer `docs/current-status.md`, `docs/ai-collaboration.md` y `docs/tasks.md` antes de editar. El código y `git log origin/main` determinan el estado real; no asumir que un documento antiguo está actualizado.

- Sergio pide explicaciones en español claro y preguntas de una en una.
- Codex mantiene el diseño y Claude las funcionalidades. La presentación también requiere JSX: no editar simultáneamente un archivo compartido.
- Sergio ha autorizado implementar, integrar y publicar los cambios de diseño sin revisión estética previa de él o de Claude. Hacer las comprobaciones técnicas y conservar cambios ajenos.
- Trabajar en una rama propia, comprobar el estado antes de editar y actualizar contra `main` antes de integrar. No descartar ni sobrescribir el trabajo de otra herramienta.
- Diseño vigente: `src/design-system.css` y `docs/diseno-integral.md`. Conservar rutas, manejadores, permisos y acceso a datos cuando se cambia la presentación.
- No cambiar Supabase ni sus secretos por una tarea visual. No incorporar datos de prueba a producción.
- Comunicar la diferencia entre una prueba local, un cambio en GitHub y un despliegue verificado. No afirmar que Claude recibió un aviso automático.
