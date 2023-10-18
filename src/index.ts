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
  private readonly cookies: Map<string, string>;
  private eventHandler: ((this: CookieStore, ev: Event) => any) | null = null;

  constructor(cookie: string = '') {
    super();

    this.cookies = cookie.split('; ')
      .filter(Boolean)
      .reduce((map, cookie) => {
        const [name, value] = cookie.split('=');
        return map.set(name, value);
      }, new Map());
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
      return;
    }
    this.eventHandler = handler.bind(this);

    this.addEventListener('change', this.eventHandler);
  }
}
