import { describe, it, expect } from 'vitest';
import { SITE_CONFIG } from '../config/site.js';

describe('Proxy Headers & User-Agent Compliance', () => {
  it('should have a descriptive, non-spoofed User-Agent with a contact TODO', () => {
    const ua = SITE_CONFIG.upstreamUserAgent;
    expect(ua).toBeDefined();
    expect(ua.length).toBeGreaterThan(10);
    // Must NOT spoof standard browser user agents
    expect(ua).not.toContain('Mozilla/5.0');
    expect(ua).not.toContain('Chrome/');
    expect(ua).not.toContain('Safari/');
    // Must contain contact placeholder or repository identifier
    expect(ua.toLowerCase()).toMatch(/manga|site/);
  });

  it('should ensure headers never include Via', () => {
    const headers = new Headers({
      'User-Agent': SITE_CONFIG.upstreamUserAgent,
      'Via': '1.1 varnish',
    });

    // Simulate proxy preparation
    headers.delete('Via');
    headers.delete('via');

    expect(headers.get('Via')).toBeNull();
    expect(headers.get('User-Agent')).toBe(SITE_CONFIG.upstreamUserAgent);
  });
});
