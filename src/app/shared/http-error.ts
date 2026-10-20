export function mensajeErrorHttp(err: any, fallback: string): string {
  const body = err?.error;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (typeof body?.message === 'string' && body.message.trim()) {
    return body.message;
  }
  if (Array.isArray(body?.errors) && body.errors.length) {
    return body.errors.join(' · ');
  }
  if (err?.status === 0) {
    return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  }
  if (err?.status === 401) {
    return 'Tu sesión expiró. Cierra sesión y vuelve a entrar.';
  }
  if (err?.status === 403) {
    return 'No tienes permisos para realizar esta acción.';
  }
  if (err?.status === 503) {
    return 'El servidor o la base de datos no responden. Intenta de nuevo en unos segundos.';
  }

  return fallback;
}
