import { describe, test ,expect, vi, beforeEach, afterEach } from 'vitest';
import { CookieStore, CookieChangeEvent, CookieObserver } from '.';

const document = {
  cookie: '',
};

describe('store', () => {
  test('cookie parsing', async () => {
    let store, result;
    store = new CookieStore(document);
    result = await store.getAll();
    expect(result).toEqual([]);

    document.cookie = 'foo=bar';
    store = new CookieStore(document);
    result = await store.getAll();
    expect(result).toHaveLength(1);
    expect(result).toEqual(expect.arrayContaining([{ name: 'foo', value: 'bar' }]));

    document.cookie ='foo=bar; fizz=buzz';
    store = new CookieStore(document);
    result = await store.getAll();
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([{ name: 'foo', value: 'bar' }, { name: 'fizz', value: 'buzz' }]));
  });

  test('methods', async () => {
    document.cookie = 'foo=bar; fizz=buzz';
    const store = new CookieStore(document);

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
    expect(document.cookie).toContain('hello=world');

    expect(stub).toHaveBeenCalledOnce();
    expect(stub2).toHaveBeenCalledOnce();
    expect(stub.mock.lastCall[0]).toBeInstanceOf(CookieChangeEvent);
    expect(stub2.mock.lastCall[0]).toBeInstanceOf(CookieChangeEvent);
    expect(stub.mock.lastCall[0].detail).toEqual({ changed: expect.arrayContaining([{ name: 'hello', value: 'world' }]), deleted: [] });
    expect(stub2.mock.lastCall[0].detail).toEqual({ changed: expect.arrayContaining([{ name: 'hello', value: 'world' }]), deleted: [] });

    const fooValue = await store.get('foo');
    await store.delete('foo');

    expect(store.getAll()).resolves.toEqual(expect.arrayContaining([{ name: 'fizz', value: 'buzz' }, { name: 'hello', value: 'world' }]));
    expect(document.cookie).not.toContain(`foo=${fooValue}`);

    expect(stub).toBeCalledTimes(2);
    expect(stub2).toBeCalledTimes(2);
    expect(stub.mock.lastCall[0]).toBeInstanceOf(CookieChangeEvent);
    expect(stub2.mock.lastCall[0]).toBeInstanceOf(CookieChangeEvent);
    expect(stub.mock.lastCall[0].detail).toEqual({ changed: [], deleted: expect.arrayContaining([{ name: 'foo' }]) });
    expect(stub2.mock.lastCall[0].detail).toEqual({ changed: [], deleted: expect.arrayContaining([{ name: 'foo' }]) });
  });
});

describe('observer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('callback', async () => {
    document.cookie = '';
    const store = new CookieStore(document);

    const callback = vi.fn();
    const observer = new CookieObserver(callback);
    observer.observe(store);

    await vi.runOnlyPendingTimersAsync();

    expect(callback).not.toBeCalled();

    document.cookie = 'foo=bar';
    await vi.runOnlyPendingTimersAsync();

    expect(callback).toBeCalledWith({
      changed: [{ name: 'foo', value: 'bar' }],
      deleted: [],
    });

    observer.unobserve();
    document.cookie = 'fizz=buzz';

    expect(callback).toHaveBeenCalledOnce();
  });
});
