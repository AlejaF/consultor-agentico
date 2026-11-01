import { describe, expect, it } from 'vitest';
import { formatSize } from '../../src/domain/format';

describe('formatSize', () => {
  it('bytes, KB y MB con coma decimal', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1536)).toBe('1,5 KB');
    expect(formatSize(1048576)).toBe('1,0 MB');
    expect(formatSize(26_214_400)).toBe('25,0 MB');
  });
});
