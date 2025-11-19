/**
 * Ejemplo de validación batch con progreso
 */

import { MailSafeProClient } from '../src';

async function batchValidation() {
  const client = new MailSafeProClient({
    apiKey: 'your_api_key_here',
  });

  const emails = [
    'user1@example.com',
    'user2@example.com',
    'user3@example.com',
    // ... más emails
  ];

  try {
    console.log(`Validando ${emails.length} emails...`);

    // Opción 1: Batch síncrono
    const results = await client.batchValidateEmails({
      emails,
      checkSmtp: true,
    });

    console.log(`✓ Válidos: ${results.validCount}`);
    console.log(`✗ Inválidos: ${results.invalidCount}`);
    console.log(`⏱ Tiempo: ${results.processingTime}ms`);

    // Filtrar solo emails válidos
    const validEmails = results.results.filter(r => r.valid && r.riskScore < 50).map(r => r.email);

    console.log(`Emails válidos de bajo riesgo: ${validEmails.length}`);
  } catch (error) {
    console.error('Error en validación batch:', error);
  } finally {
    client.destroy();
  }
}

async function batchUploadWithProgress() {
  const client = new MailSafeProClient({
    apiKey: 'your_api_key_here',
  });

  try {
    // Upload archivo CSV
    const fs = require('fs');
    const fileBuffer = fs.readFileSync('emails.csv');

    console.log('Subiendo archivo...');
    const job = await client.uploadFileBatch(fileBuffer, {
      filename: 'emails.csv',
      contentType: 'text/csv',
      checkSmtp: true,
    });

    console.log(`Job ID: ${job.jobId}`);
    console.log('Esperando completado...');

    // Esperar con callback de progreso
    const results = await client.waitForBatchCompletion(job.jobId, {
      pollInterval: 2000,
      timeout: 300000,
      onProgress: status => {
        const progress = status.progress || 0;
        const bar =
          '█'.repeat(Math.floor(progress / 2)) + '░'.repeat(50 - Math.floor(progress / 2));
        console.log(`[${bar}] ${progress.toFixed(1)}%`);
      },
    });

    console.log('\n✓ Completado!');
    console.log(`Válidos: ${results.validCount}`);
    console.log(`Inválidos: ${results.invalidCount}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.destroy();
  }
}

if (require.main === module) {
  // batchValidation().catch(console.error);
  batchUploadWithProgress().catch(console.error);
}

export { batchValidation, batchUploadWithProgress };
