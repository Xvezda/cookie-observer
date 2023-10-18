import { describe, test ,expect, vi } from 'vitest';
import { CookieStore, CookieChangeEvent } from '.';

describe('store', () => {
  test('cookie parsing', async () => {
    let store, result;
    store = new CookieStore();
    result = await store.getAll();
    expect(result).toEqual([]);

    store = new CookieStore('foo=bar');
    result = await store.getAll();
    expect(result).toHaveLength(1);
    expect(result).toEqual(expect.arrayContaining([{ name: 'foo', value: 'bar' }]));

    store = new CookieStore('foo=bar; fizz=buzz');
    result = await store.getAll();
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([{ name: 'foo', value: 'bar' }, { name: 'fizz', value: 'buzz' }]));
  });

  test('methods', async () => {
    const store = new CookieStore('foo=bar; fizz=buzz');

    expect(store.get('foo')).resolves.toEqual({ name: 'foo', value: 'bar' });
    expect(store.get('fizz')).resolves.toEqual({ name: 'fizz', value: 'buzz' });
    expect(store.get('boo')).resolves.toEqual(null);

    expect(store.getAll('foo')).resolves.toEqual([{ name: 'foo', value: 'bar' }]);
    expect(store.getAll('boo')).resolves.toEqual([]);

    const stub = vi.fn();
    const stub2 = vi.fn();
    store.addEventListener('change', stub);
    store.onchange = stub2;

    await store.set('hello', 'world');
    expect(store.getAll()).resolves.toEqual(expect.arrayContaining([{ name: 'foo', value: 'bar' }, { name: 'fizz', value: 'buzz' }, { name: 'hello', value: 'world' }]));

    expect(stub).toHaveBeenCalledOnce();
    expect(stub2).toHaveBeenCalledOnce();
    expect(stub.mock.lastCall[0]).toBeInstanceOf(CookieChangeEvent);
    expect(stub2.mock.lastCall[0]).toBeInstanceOf(CookieChangeEvent);
    expect(stub.mock.lastCall[0].detail).toEqual({ changed: expect.arrayContaining([{ name: 'hello', value: 'world' }]), deleted: [] });
    expect(stub2.mock.lastCall[0].detail).toEqual({ changed: expect.arrayContaining([{ name: 'hello', value: 'world' }]), deleted: [] });

    await store.delete('foo');
    expect(store.getAll()).resolves.toEqual(expect.arrayContaining([{ name: 'fizz', value: 'buzz' }, { name: 'hello', value: 'world' }]));

    expect(stub).toBeCalledTimes(2);
    expect(stub2).toBeCalledTimes(2);
    expect(stub.mock.lastCall[0]).toBeInstanceOf(CookieChangeEvent);
    expect(stub2.mock.lastCall[0]).toBeInstanceOf(CookieChangeEvent);
    expect(stub.mock.lastCall[0].detail).toEqual({ changed: [], deleted: expect.arrayContaining([{ name: 'foo' }]) });
    expect(stub2.mock.lastCall[0].detail).toEqual({ changed: [], deleted: expect.arrayContaining([{ name: 'foo' }]) });
  });
});
