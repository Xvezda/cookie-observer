/** @see https://wicg.github.io/cookie-store/#dictdef-cookielistitem */
interface CookieItem {
  name: string;
  value: string;
}

interface CookieChangeEventProperties {
  changed: CookieItem[];
  deleted: Pick<CookieItem, 'name'>[];
}

export class CookieChangeEvent extends CustomEvent<CookieChangeEventProperties> {
  constructor(type: 'change', options?: Partial<CookieChangeEventProperties>) {
    super(
      type, {
        detail: {
          changed: Array.isArray(options?.changed) ? options!.changed : [],
          deleted: Array.isArray(options?.deleted) ? options!.deleted : [],
        }
      }
    );
  }
}

export class CookieStore extends EventTarget {
  private cookies: Map<string, string> = new Map();
  private document: { cookie: string };
  private eventHandler: ((ev: Event) => any) | ((this: CookieStore, ev: Event) => any) | null = null;
  public readonly _isPolyfill = true;

  constructor(document: { cookie: string }) {
    super();

    this.document = document;
    this._parse();

    this.addEventListener('change', () => {
      this.document.cookie = Array.from(this.cookies)
        .reduce((acc, [k, v]) => acc.concat(`${k}=${v}`), [] as string[])
        .join('; ');
    });
  }

  /** @package */
  _parse() {
    const newCookies = this.document.cookie.split('; ')
      .filter(Boolean)
      .reduce((map, cookie) => {
        const [name, value] = cookie.split('=');
        return map.set(name, value);
      }, new Map());

    this.cookies.forEach((value, name) => {
      if (!newCookies.has(name)) {
        this.dispatchEvent(new CookieChangeEvent('change', { deleted: [{ name }] }));
      } else if (newCookies.get(name) !== value) {
        this.dispatchEvent(new CookieChangeEvent('change', { changed: [{ name, value: newCookies.get(name) }] }));
      }
    });

    newCookies.forEach((value, name) => {
      if (!this.cookies.has(name) || this.cookies.get(name) !== value) {
        this.dispatchEvent(new CookieChangeEvent('change', { changed: [{ name, value }] }));
      }
    });

    this.cookies = newCookies;
  }

  async get(name: string): Promise<CookieItem | null> {
    if (!this.cookies.has(name)) {
      return null;
    }

    return {
      name,
      value: this.cookies.get(name)!,
    };
  }

  async getAll(name?: string): Promise<CookieItem[]> {
    if (typeof name !== 'undefined') {
      const item = await this.get(name);
      if (item === null) {
        return [];
      }
      return [item];
    }

    return Array.from(this.cookies)
      .map(([name, value ]) => ({ name, value }));
  }

  async set(name: string, value: string): Promise<undefined> {
    this.cookies.set(name, value);

    const event = new CookieChangeEvent('change', { changed: [{ name, value }] });
    this.dispatchEvent(event);

    return undefined;
  }

  async delete(name: string): Promise<undefined> {
    this.cookies.delete(name);

    const event = new CookieChangeEvent('change', { deleted: [{ name }] });
    this.dispatchEvent(event);

    return undefined;
  }

  get onchange() {
    return this.eventHandler;
  }

  set onchange(handler) {
    if (!handler) {
      this.removeEventListener('change', this.eventHandler);
      this.eventHandler = null;
      return;
    }
    this.eventHandler = handler.bind(this);

    this.addEventListener('change', this.eventHandler);
  }
}

export class CookieObserver {
  private callback: (properties: CookieChangeEventProperties) => void;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(callback: (properties: CookieChangeEventProperties) => void) {
    this.callback = callback;
  }

  observe(store: CookieStore) {
    store.onchange = (e: Event) => {
      this.callback((e as CookieChangeEvent).detail);
    };

    if (store?._isPolyfill) {
      this.intervalId = setInterval(() => {
        store._parse();
      }, 100);
    }
  }

  unobserve() {
    clearInterval(this.intervalId);
  }
}
