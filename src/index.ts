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
    super(type, {
      detail: {
        changed: Array.isArray(options?.changed) ? options!.changed : [],
        deleted: Array.isArray(options?.deleted) ? options!.deleted : [],
      },
    });
  }
}

export class CookieStore extends EventTarget {
  private cookies: Map<string, string> = new Map();
  private document: { cookie: string };
  private eventHandler:
    | ((ev: Event) => any)
    | ((this: CookieStore, ev: Event) => any)
    | null = null;
  public readonly _isPolyfill = true;

  constructor(document: { cookie: string }) {
    super();

    this.document = document;
    this._import();
  }

  /** @package */
  _export() {
    this.document.cookie = Array.from(this.cookies)
      .reduce((acc, [k, v]) => acc.concat(`${k}=${v}`), [] as string[])
      .join('; ');
  }

  /** @package */
  _import() {
    const newCookies = this.document.cookie
      .split('; ')
      .filter(Boolean)
      .reduce((map, cookie) => {
        const [name, value] = cookie.split('=');
        return map.set(name, value);
      }, new Map());

    const deletedCookies = new Set<string>();
    const changedCookies = new Map<string, string>();
    this.cookies.forEach((value, name) => {
      if (!newCookies.has(name)) {
        deletedCookies.add(name);
      } else if (newCookies.get(name) !== value) {
        changedCookies.set(name, newCookies.get(name));
      }
    });

    newCookies.forEach((value, name) => {
      if (!this.cookies.has(name) || this.cookies.get(name) !== value) {
        changedCookies.set(name, value);
      }
    });

    deletedCookies.forEach((name) => {
      this.dispatchEvent(
        new CookieChangeEvent('change', { deleted: [{ name }] }),
      );
    });

    changedCookies.forEach((value, name) => {
      this.dispatchEvent(
        new CookieChangeEvent('change', { changed: [{ name, value }] }),
      );
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

    return Array.from(this.cookies).map(([name, value]) => ({ name, value }));
  }

  async set(name: string, value: string): Promise<undefined> {
    this.cookies.set(name, value);

    const event = new CookieChangeEvent('change', {
      changed: [{ name, value }],
    });
    this.dispatchEvent(event);
    this._export();

    return undefined;
  }

  async delete(name: string): Promise<undefined> {
    this.cookies.delete(name);

    const event = new CookieChangeEvent('change', { deleted: [{ name }] });
    this.dispatchEvent(event);
    this._export();

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
    if (store?._isPolyfill) {
      store.onchange = (e: Event) => {
        this.callback((e as CookieChangeEvent).detail);
      };

      this.intervalId = setInterval(() => {
        store._import();
      }, 100);
    } else {
      let previousCookie = document.cookie;

      store.onchange = (e) => {
        if (document.cookie === previousCookie) {
          return;
        }
        previousCookie = document.cookie;

        const { changed = [], deleted = [] } =
          e as unknown as CookieChangeEventProperties;

        this.callback({
          changed: changed.map(({ name, value }) => ({ name, value })),
          deleted: deleted.map(({ name }) => ({ name })),
        });
      };
    }
  }

  unobserve() {
    clearInterval(this.intervalId);
  }
}
