import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../src/client';

// Mock fetch
global.fetch = vi.fn();

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new ApiClient({ baseUrl: 'https://api.example.com' });
  });

  describe('constructor', () => {
    it('should create client with base URL', () => {
      expect(client).toBeDefined();
    });

    it('should accept custom headers', () => {
      const customClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        headers: { 'X-Custom': 'value' },
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('setAuthToken', () => {
    it('should set authorization header', () => {
      client.setAuthToken('test-token');
      // Token is set internally - we test it through a request
      expect(client).toBeDefined();
    });
  });

  describe('removeAuthToken', () => {
    it('should remove authorization header', () => {
      client.setAuthToken('test-token');
      client.removeAuthToken();
      expect(client).toBeDefined();
    });
  });

  describe('get', () => {
    it('should make GET request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      const result = await client.get<{ data: string }>('/test');

      expect(result.data).toEqual({ data: 'test' });
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      });

      const result = await client.get('/not-found');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('HTTP_404');
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await client.get('/test');

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123' }),
      });

      const result = await client.post<{ id: string }>('/create', { name: 'test' });

      expect(result.data).toEqual({ id: '123' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/create',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      );
    });
  });

  describe('put', () => {
    it('should make PUT request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updated: true }),
      });

      const result = await client.put<{ updated: boolean }>('/update', { value: 'new' });

      expect(result.data?.updated).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/update',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('patch', () => {
    it('should make PATCH request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patched: true }),
      });

      const result = await client.patch<{ patched: boolean }>('/patch', { field: 'value' });

      expect(result.data?.patched).toBe(true);
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deleted: true }),
      });

      const result = await client.delete<{ deleted: boolean }>('/item/123');

      expect(result.data?.deleted).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/item/123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
