# Correos de Nüra en español (plantillas de Supabase)

Supabase manda los correos de acceso con sus plantillas, en inglés por defecto. Se cambian en el panel: **Authentication → Emails** (en algunas versiones, **Email Templates**). Para cada una: pega el asunto en «Subject» y el cuerpo en «Body» (pestaña de código/HTML) y guarda.

Variables de Supabase que no hay que tocar: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`, `{{ .Code }}`.

El remitente (`noreply@mail.app.supabase.io`) y su nombre solo cambian con un servidor de correo propio (SMTP), que además quita el límite de envíos del servidor de prueba de Supabase. Ver `docs/lanzamiento-cuentas.md`.

## Confirm signup

Asunto: `Confirma tu correo para entrar en Nüra`

```html
<div style="background:#F4F1F8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px 24px;"><p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#241B33;">Nüra</p><h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#241B33;">Confirma tu correo</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Hola. Has creado tu acceso a Nüra con este correo.</p><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Pulsa el botón para confirmarlo. Volverás a Nüra ya dentro de tu cuenta.</p><p style="margin:24px 0;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6B3FC4;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:999px;">Confirmar mi correo</a></p><p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#6E6480;">Si el botón no funciona, copia esta dirección en el navegador:<br><span style="word-break:break-all;">{{ .ConfirmationURL }}</span></p><p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6E6480;">Si no has sido tú, ignora este correo: no se creará ninguna cuenta.</p></div></div>
```

## Invite user

Asunto: `Te han invitado a Nüra`

```html
<div style="background:#F4F1F8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px 24px;"><p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#241B33;">Nüra</p><h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#241B33;">Te esperamos en Nüra</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Te han invitado a crear tu acceso a Nüra con este correo.</p><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Pulsa el botón para aceptar la invitación.</p><p style="margin:24px 0;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6B3FC4;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:999px;">Aceptar la invitación</a></p><p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#6E6480;">Si el botón no funciona, copia esta dirección en el navegador:<br><span style="word-break:break-all;">{{ .ConfirmationURL }}</span></p><p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6E6480;">Si no esperabas esta invitación, ignora este correo.</p></div></div>
```

## Magic Link

Asunto: `Tu enlace para entrar en Nüra`

```html
<div style="background:#F4F1F8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px 24px;"><p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#241B33;">Nüra</p><h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#241B33;">Entra en Nüra</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Pulsa el botón para entrar en tu cuenta. El enlace sirve una sola vez y caduca en poco tiempo.</p><p style="margin:24px 0;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6B3FC4;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:999px;">Entrar en Nüra</a></p><p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#6E6480;">Si el botón no funciona, copia esta dirección en el navegador:<br><span style="word-break:break-all;">{{ .ConfirmationURL }}</span></p><p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6E6480;">Si no lo has pedido tú, ignora este correo: nadie entrará en tu cuenta.</p></div></div>
```

## Change Email Address

Asunto: `Confirma el cambio de correo en Nüra`

```html
<div style="background:#F4F1F8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px 24px;"><p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#241B33;">Nüra</p><h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#241B33;">Confirma el cambio de correo</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Has pedido cambiar el correo de tu cuenta de Nüra de <strong>{{ .Email }}</strong> a <strong>{{ .NewEmail }}</strong>.</p><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Te enviamos este mensaje a los dos correos. Pulsa el botón en los dos para terminar el cambio. Hasta entonces, sigues entrando con {{ .Email }}.</p><p style="margin:24px 0;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6B3FC4;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:999px;">Confirmar el cambio</a></p><p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#6E6480;">Si el botón no funciona, copia esta dirección en el navegador:<br><span style="word-break:break-all;">{{ .ConfirmationURL }}</span></p><p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6E6480;">Si no lo has pedido tú, no pulses nada: tu correo no cambiará.</p></div></div>
```

## Reset Password

Asunto: `Pon una contraseña nueva en Nüra`

```html
<div style="background:#F4F1F8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px 24px;"><p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#241B33;">Nüra</p><h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#241B33;">Pon una contraseña nueva</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Has pedido cambiar la contraseña de tu cuenta de Nüra.</p><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Pulsa el botón y escribe la nueva. El enlace sirve una sola vez.</p><p style="margin:24px 0;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6B3FC4;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 24px;border-radius:999px;">Poner una contraseña nueva</a></p><p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#6E6480;">Si el botón no funciona, copia esta dirección en el navegador:<br><span style="word-break:break-all;">{{ .ConfirmationURL }}</span></p><p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6E6480;">Si no lo has pedido tú, ignora este correo: tu contraseña no cambia.</p></div></div>
```

## Reauthentication

Asunto: `Tu código de Nüra`

```html
<div style="background:#F4F1F8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px 24px;"><p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#241B33;">Nüra</p><h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#241B33;">Tu código de confirmación</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;">Escribe este código en Nüra para confirmar que eres tú:</p><p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3D3350;"><span style="display:inline-block;font-size:28px;font-weight:800;letter-spacing:6px;color:#241B33;">{{ .Token }}</span></p><p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6E6480;">Si no lo has pedido tú, ignora este correo.</p></div></div>
```

## SMS (Authentication → Providers → Phone → «SMS message»)

```
Tu código de Nüra es {{ .Code }}. No se lo digas a nadie.
```
