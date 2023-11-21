# CookieObserver

| [English](README.md) |
| -------------------- |

`document.cookie`와 `cookieStore`를 위한 옵저버 형태 구현체와 미지원 브라우저를 위한 `cookieStore`의 유사 폴리필 클래스를 제공합니다.

## 설치

```sh
# npm
npm install cookie-observer
# yarn
yarn add cookie-observer
# pnpm
pnpm add cookie-observer
```

## 사용법

```ts
import { CookieStore, CookieObserver } from 'cookie-observer';

const store =
  typeof cookieStore !== 'undefined' ? cookieStore : new CookieStore(document);

const observer = new CookieObserver((entries) => {
  console.debug(entries);
});
observer.observe(store);
```

## 한계

자바스크립트 수준에서의 쿠키 접근은 쿠키 이름과 값에 한정되어 있기 때문에 호환성과 일관성 유지를 위하여 `name`과 `value` 필드를 제외한 나머지 필드는 의도적으로 생략하였습니다.

## TODO

- [x] `cookieStore` 인터페이스 구현
- [ ] `observe` 옵션 추가 (interval 조정, extra field 유지 등)
- [ ] 폴리필 형태의 설치 스크립트 추가
