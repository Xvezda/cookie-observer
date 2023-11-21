# CookieObserver

| [한국어](README.ko.md) |
| -------------------- |

Provides an observer-style implementation for `document.cookie` and `cookieStore`, along with a polyfill class for `cookieStore` for unsupported browsers.

## Limitations
Access to cookies at the JavaScript level is limited to the name and value of the cookie. 
To maintain compatibility and consistency, the fields other than `name` and `value` have intentionally been omitted.

## TODO
- [x] Implement the `cookieStore` interface.
- [ ] Add the `observe` option (adjust interval, maintain extra fields, etc.).
- [ ] Add a polyfill like installation script.
