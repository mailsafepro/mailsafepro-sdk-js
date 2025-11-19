/**
 * Jest setup file
 * Se ejecuta antes de todos los tests
 */

// Configurar timeouts globales
jest.setTimeout(10000);

// Mock de console para tests más limpios (opcional)
global.console = {
  ...console,
  // Mantener error y warn
  error: jest.fn(console.error),
  warn: jest.fn(console.warn),
  // Silenciar log, info, debug en tests
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Variables de entorno para tests
process.env.NODE_ENV = 'test';

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
