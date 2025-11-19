/**
 * Ejemplo de rate limiting y concurrencia
 */

import { MailSafeProClient } from '../src';

async function rateLimitingExample() {
  // Configurar rate limiting
  const client = new MailSafeProClient({
    apiKey: 'your_api_key_here',
    rateLimitConfig: {
      maxRequestsPerSecond: 5, // 5 requests por segundo
      maxConcurrent: 3, // Máximo 3 requests simultáneos
    },
  });

  const emails = Array(50)
    .fill(0)
    .map((_, i) => `user${i}@example.com`);

  console.log(`Validando ${emails.length} emails con rate limiting...`);
  console.log('5 req/s, máx 3 concurrentes');

  const startTime = Date.now();

  try {
    // El SDK automáticamente respeta los límites
    const promises = emails.map(email => client.validateEmail({ email }));

    const results = await Promise.all(promises);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✓ Completado en ${duration.toFixed(1)}s`);
    console.log(`Velocidad: ${(emails.length / duration).toFixed(1)} emails/s`);

    const valid = results.filter(r => r.valid).length;
    console.log(`Válidos: ${valid}/${emails.length}`);

    // Estadísticas del rate limiter
    const stats = client.getRateLimiterStats();
    console.log('\nEstadísticas:', stats);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.destroy();
  }
}

if (require.main === module) {
  rateLimitingExample().catch(console.error);
}

export { rateLimitingExample };
