/**
 * Ejemplo básico de uso del SDK
 */

import { MailSafeProClient } from '../src';

async function basicUsage() {
  // Inicializar cliente con API Key
  const client = new MailSafeProClient({
    apiKey: 'your_api_key_here',
  });

  try {
    // Validar un email
    const result = await client.validateEmail({
      email: 'test@example.com',
      checkSmtp: true,
    });

    console.log('Email válido:', result.valid);
    console.log('Risk Score:', result.riskScore);
    console.log('Provider:', result.provider);
    console.log('Mailbox existe:', result.mailboxExists);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.destroy();
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  basicUsage().catch(console.error);
}

export { basicUsage };
