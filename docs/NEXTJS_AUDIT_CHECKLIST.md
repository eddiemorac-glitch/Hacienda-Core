# Checklist de Auditoría para Next.js y Seguridad

Basado en las mejores prácticas de la industria, aquí hay una lista de verificación para auditar errores del sistema y vulnerabilidades de seguridad en nuestra aplicación Next.js.

## 1. Auditoría de Vulnerabilidades de Seguridad

**Gestión de Dependencias:**
- [ ] Ejecutar `npm audit` regularmente.
- [ ] Actualizar dependencias obsoletas.

**Validación y Sanitización de Entradas:**
- [ ] NUNCA confiar en la entrada del usuario.
- [ ] Usar librerías como Zod para validar esquemas de datos.
- [ ] Sanitizar datos en `dangerouslySetInnerHTML` usando DOMPurify.

**Variables de Entorno y Secretos:**
- [x] Asegurar que no se expongan secretos del servidor al cliente.
- [x] Usar `.env.local` para secretos locales (ignorado en git).
- [x] Usar `NEXT_PUBLIC_` SOLO para información pública.

**Autenticación y Autorización:**
- [x] Implementar middleware para validación de sesiones.
- [x] Verificar autorización en Server Actions y API Routes, no solo en middleware.
- [x] Usar cookies `httpOnly` para JWTs/tokens (Manejado por NextAuth).

**Seguridad de API Routes:**
- [ ] Implementar rate limiting.
- [ ] Validar y sanitizar URLs externas (evitar SSRF).

**Protección CSRF:**
- [ ] Usar encabezados CSRF y cookies `SameSite=Strict` o `Lax`.

**Encabezados de Seguridad:**
- [ ] Implementar Content Security Policy (CSP).
- [ ] Forzar HTTPS.

## 2. Auditoría de Errores del Sistema

**Manejo de Errores:**
- [ ] Implementar límites de error (`error.jsx` y `global-error.jsx`).
- [ ] Manejar errores esperados como valores de retorno en Server Actions, no solo `throw`.

**Logging y Monitoreo:**
- [ ] No exponer detalles sensibles en mensajes de error al usuario.
- [ ] Usar herramientas como PostHog o Sentry para capturar errores.
- [ ] Subir source maps para depuración en producción.

**Base de Datos y Capa de Datos:**
- [x] Verificar que no se importen paquetes de DB en componentes cliente.
- [x] Validar argumentos en Server Actions ("use server").

**Performance y Bundle Size:**
- [ ] Usar `@next/bundle-analyzer`.
- [ ] Verificar presupuestos de tamaño de bundle por ruta.
