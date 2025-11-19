/**
 * Tests para el sistema de logging
 */

import { ConsoleLogger, SilentLogger, MemoryLogger } from '../../src/utils/logger';

describe('Logger', () => {
  describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      logger = new ConsoleLogger({ level: 'DEBUG' });
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should create logger with default options', () => {
      const defaultLogger = new ConsoleLogger();
      expect(defaultLogger).toBeDefined();
    });

    it('should log debug messages when level is DEBUG', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Warn message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Error message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should change log level and filter messages', () => {
      if (logger.setLevel) {
        logger.setLevel('ERROR');
      }
      consoleLogSpy.mockClear();

      logger.debug('Should not log');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      logger.error('Should log');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should format objects in arguments', () => {
      logger.info('Test message', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('SilentLogger', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should not log anything', () => {
      const logger = new SilentLogger();

      logger.debug('test');
      logger.info('test');
      logger.warn('test');
      logger.error('test');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('MemoryLogger', () => {
    let logger: MemoryLogger;

    beforeEach(() => {
      logger = new MemoryLogger(100);
    });

    afterEach(() => {
      logger.clear();
    });

    it('should store logs in memory', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
      expect(logs[0].level).toBe('DEBUG');
      expect(logs[1].level).toBe('INFO');
      expect(logs[2].level).toBe('WARN');
      expect(logs[3].level).toBe('ERROR');
    });

    it('should filter logs by level', () => {
      logger.info('Info 1');
      logger.error('Error 1');
      logger.info('Info 2');

      const infoLogs = logger.getLogsByLevel('INFO');
      expect(infoLogs).toHaveLength(2);

      const errorLogs = logger.getLogsByLevel('ERROR');
      expect(errorLogs).toHaveLength(1);
    });

    it('should clear logs', () => {
      logger.info('Test');
      expect(logger.getLogs()).toHaveLength(1);

      logger.clear();
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should respect max logs limit', () => {
      const smallLogger = new MemoryLogger(3);

      smallLogger.info('Message 1');
      smallLogger.info('Message 2');
      smallLogger.info('Message 3');
      smallLogger.info('Message 4');
      smallLogger.info('Message 5');

      const logs = smallLogger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Message 3');
      expect(logs[1].message).toBe('Message 4');
      expect(logs[2].message).toBe('Message 5');
    });

    it('should convert logs to string', () => {
      logger.info('Test message');
      logger.error('Error message');

      const str = logger.toString();

      expect(str).toContain('[INFO]');
      expect(str).toContain('Test message');
      expect(str).toContain('[ERROR]');
      expect(str).toContain('Error message');
    });
  });
  describe('Additional Logger Coverage', () => {
    describe('ConsoleLogger Edge Cases', () => {
      let logger: ConsoleLogger;
      let consoleLogSpy: jest.SpyInstance;

      beforeEach(() => {
        logger = new ConsoleLogger({ level: 'DEBUG', colors: false, timestamp: false });
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      });

      afterEach(() => {
        consoleLogSpy.mockRestore();
      });

      it('should log without colors', () => {
        logger.info('Test without colors');
        expect(consoleLogSpy).toHaveBeenCalled();
      });

      it('should log without timestamp', () => {
        logger.info('Test without timestamp');
        expect(consoleLogSpy).toHaveBeenCalled();
      });

      it('should handle custom prefix', () => {
        const customLogger = new ConsoleLogger({ prefix: '[CustomSDK]' });
        const spy = jest.spyOn(console, 'log').mockImplementation();

        customLogger.info('Test');
        expect(spy).toHaveBeenCalled();

        spy.mockRestore();
      });

      it('should log with multiple arguments', () => {
        logger.info('Message', 'arg1', 'arg2', { key: 'value' });
        expect(consoleLogSpy).toHaveBeenCalled();
      });

      it('should handle circular objects gracefully', () => {
        const circular: any = { name: 'test' };
        circular.self = circular;

        logger.info('Circular object', circular);
        expect(consoleLogSpy).toHaveBeenCalled();
      });

      it('should filter logs based on level', () => {
        const warnLogger = new ConsoleLogger({ level: 'WARN' });
        const spy = jest.spyOn(console, 'log').mockImplementation();

        warnLogger.debug('Should not log');
        warnLogger.info('Should not log');
        warnLogger.warn('Should log');
        warnLogger.error('Should log');

        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
      });
    });

    describe('MemoryLogger Edge Cases', () => {
      it('should handle max logs of 1', () => {
        const logger = new MemoryLogger(1);

        logger.info('First');
        logger.info('Second');

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe('Second');
      });

      it('should store complex objects', () => {
        const logger = new MemoryLogger();
        const complexObj = {
          nested: {
            deep: {
              value: 'test',
            },
          },
          array: [1, 2, 3],
        };

        logger.info('Complex', complexObj);

        const logs = logger.getLogs();
        expect(logs[0].args[0]).toEqual(complexObj);
      });

      it('should maintain timestamp order', () => {
        const logger = new MemoryLogger();

        logger.info('First');
        logger.info('Second');
        logger.info('Third');

        const logs = logger.getLogs();

        expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(logs[1].timestamp.getTime());
        expect(logs[1].timestamp.getTime()).toBeLessThanOrEqual(logs[2].timestamp.getTime());
      });

      it('should handle empty toString', () => {
        const logger = new MemoryLogger();
        expect(logger.toString()).toBe('');
      });
    });
  });
});
