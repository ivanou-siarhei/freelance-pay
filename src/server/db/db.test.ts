import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn().mockResolvedValue({ rows: [] });

vi.mock('pg', () => ({
  Pool: vi.fn(function () {
    this.query = mockQuery;
  }),
}));

vi.mock('../config', () => ({
  config: {
    neon: {
      connectionString: 'postgresql://test:test@localhost:5432/testdb',
    },
  },
}));

describe('neon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [] });
  });

  it('exports neonPool', async () => {
    const { neonPool } = await import('./neon');
    expect(neonPool).toBeDefined();
  });

  it('exports query function', async () => {
    const { query } = await import('./neon');
    expect(typeof query).toBe('function');
  });

  it('query delegates to neonPool.query and returns rows', async () => {
    const mockRows = [{ id: 1, name: 'test' }];
    mockQuery.mockResolvedValueOnce({ rows: mockRows });

    const { query } = await import('./neon');
    const result = await query('SELECT * FROM test', [1]);

    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test', [1]);
    expect(result).toEqual(mockRows);
  });
});

describe('runMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [] });
  });

  it('reads schema.sql and executes it', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { runMigrations } = await import('./migrations');
    await runMigrations();

    expect(mockQuery).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Database migrations completed');

    consoleSpy.mockRestore();
  });
});
