/** @see https://wicg.github.io/cookie-store/#dictdef-cookielistitem */
interface CookieListItem {
  name: string;
  value: string;
}

/** @see https://wicg.github.io/cookie-store/#typedefdef-cookielist */
type CookieList = CookieListItem[];

interface ICookieStore extends EventTarget {
  get(name: string): Promise<CookieListItem | null>;
  getAll(name?: string): Promise<CookieList>;
  set(name: string, value: string): Promise<undefined>;
  delete(name: string): Promise<undefined>;

  onchange: ((this: ICookieStore, ev: Event) => any) | null;
}

interface CookieChangeEventProperties {
  changed: CookieList;
  deleted: Pick<CookieListItem, 'name'>[];
}

export class CookieChangeEvent extends CustomEvent<CookieChangeEventProperties> {
  constructor(type: 'cookiechange', options?: Partial<CookieChangeEventProperties>) {
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

export class CookieStore extends EventTarget implements ICookieStore {
  _cookies: Map<string, string>;
  _eventBus: EventTarget = new EventTarget;
  _eventHandler: ((this: ICookieStore, ev: Event) => any) | null = null;

  constructor(cookie: string = '') {
    super();

    this._cookies = cookie.split('; ')
      .reduce((map, cookie) => {
        const [name, value] = cookie.split('=');
        return map.set(name, value);
      }, new Map());

    this._eventBus.addEventListener('cookiechange', (e) => {
      this.dispatchEvent(e);
    });
  }

  async get(name: string) {
    if (!this._cookies.has(name)) {
      return null;
    }

    return {
      name,
      value: this._cookies.get(name)!,
    };
  }

  async getAll(name?: string) {
    if (typeof name !== 'undefined') {
      const item = await this.get(name);
      if (item === null) {
        return [];
      }
      return [item];
    }

    return Array.from(this._cookies)
      .map(([name, value ]) => ({ name, value }));
  }

  async set(name: string, value: string) {
    this._cookies.set(name, value);

    const event = new CookieChangeEvent('cookiechange', { changed: [{ name, value }] });
    this._eventBus.dispatchEvent(event);

    return undefined;
  }

  async delete(name: string) {
    this._cookies.delete(name);

    const event = new CookieChangeEvent('cookiechange', { deleted: [{ name }] });
    this._eventBus.dispatchEvent(event);

    return undefined;
  }

  get onchange() {
    return this._eventHandler;
  }

  set onchange(handler) {
    if (!handler) {
      this.removeEventListener('change', this._eventHandler);
      return;
    }
    this._eventHandler = handler.bind(this);

    this.addEventListener('change', this._eventHandler);
  }
}
