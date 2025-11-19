/**
 * Ejemplo de manejo de errores
 */

import {
  MailSafeProClient,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  QuotaExceededError,
  NetworkError,
} from '../src';

async function errorHandling() {
  const client = new MailSafeProClient({
    apiKey: 'your_api_key_here',
  });

  try {
    await client.validateEmail({ email: 'test@example.com' });
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error('⏱ Rate limit excedido');
      console.log(`Reintentar después de: ${error.retryAfter}s`);
      console.log(`Límite: ${error.limit}`);
      console.log(`Restantes: ${error.remaining}`);
      console.log(`Reset: ${error.reset}`);

      // Esperar y reintentar
      if (error.retryAfter) {
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
        // Reintentar aquí
      }
    } else if (error instanceof AuthenticationError) {
      console.error('🔒 Error de autenticación');
      console.log('Verifica tu API Key o inicia sesión nuevamente');
    } else if (error instanceof ValidationError) {
      console.error('❌ Error de validación');
      console.log('Detalles:', error.details);
    } else if (error instanceof QuotaExceededError) {
      console.error('💳 Quota excedida');
      console.log(`Usado: ${error.used}/${error.limit}`);
      console.log('Actualiza tu plan o espera al próximo ciclo');
    } else if (error instanceof NetworkError) {
      console.error('🌐 Error de red');
      console.log('Verifica tu conexión a internet');

      if (error.isTimeout) {
        console.log('⏱ La petición tardó demasiado');
      }
    } else {
      console.error('❌ Error desconocido:', error);
    }
  } finally {
    client.destroy();
  }
}

if (require.main === module) {
  errorHandling().catch(console.error);
}

export { errorHandling };
