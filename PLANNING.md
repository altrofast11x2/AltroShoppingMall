# AltroShop - 쇼핑몰 제작 계획서

## 1. 프로젝트 개요

**프로젝트명**: AltroShop
**목표**: 사진+설명으로 상품을 자유롭게 등록하고, 댓글/좋아요로 소통하며, 내부 코인(관리자가 사용자별로 무한 충전)으로 결제하는 커뮤니티형 쇼핑몰
**디자인 컨셉**: altroboard 와 동일한 종이 질감 + 와인레드 액센트 (크림 배경, 줄 패턴, 2px 샤프 코너, 세리프+모노 폰트, 다크모드 지원)

## 2. 기술 스택

| 분류 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) | altroboard 와 동일 버전 |
| 언어 | TypeScript / React 19 | |
| 데이터베이스 | Firebase Realtime DB (`cozyboard-9fb1a`) | altroboard 와 동일 프로젝트 재사용 (`shop_*` 네임스페이스로 격리) |
| 비밀번호 보안 | SHA-256 (salt=email) | altroboard 와 동일한 `lib/security.js` 패턴 |
| 호스팅 | Vercel | production 배포 |
| 이미지 처리 | Canvas 리사이즈 → Base64 → Realtime DB | 1200px / 0.82 quality JPEG 압축 |

## 3. 폴더 구조

```
AltroShop/
├── app/
│   ├── layout.tsx              루트 레이아웃 (테마 부트스트랩 + NavBar)
│   ├── page.tsx                메인 — 히어로 + 상품 그리드
│   ├── globals.css             altroboard 스타일 + 쇼핑몰 추가
│   ├── components/
│   │   └── NavBar.tsx          상단 네비 (코인 잔액 + 관리자 배너)
│   ├── login/page.tsx          로그인 / 회원가입 (탭)
│   ├── upload/page.tsx         상품 등록 (drag&drop + canvas 리사이즈)
│   ├── product/[id]/page.tsx   상품 상세 (댓글 / 좋아요 / 장바구니)
│   ├── cart/page.tsx           장바구니 + 결제
│   └── admin/page.tsx          관리자 (코인 충전 / 통계)
├── lib/
│   ├── firebase.js             Firebase Realtime DB 초기화
│   ├── security.js             SHA-256 비밀번호 해시
│   └── shop.js                 모든 CRUD (users/products/comments/cart/orders)
├── database.rules.json         Firebase 보안 규칙 (shop_* 노드)
├── .env.local                  Firebase + admin 자격 증명
├── next.config.ts
├── tsconfig.json
├── package.json
└── PLANNING.md
```

## 4. 데이터 모델 (Firebase Realtime DB)

altroboard 와 충돌 방지를 위해 모든 노드는 `shop_` 프리픽스 사용.

| 노드 | 구조 | 인덱스 |
|------|------|--------|
| `shop_users/{uid}` | `{ name, email, password (sha256), coins, isAdmin, createdAt }` | `email`, `createdAt` |
| `shop_products/{pid}` | `{ sellerId, sellerName, name, desc, price, image, likes:{uid:true}, createdAt }` | `createdAt`, `sellerId` |
| `shop_comments/{pid}/{cid}` | `{ authorId, authorName, text, createdAt }` | — |
| `shop_carts/{uid}/{pid}` | `{ qty }` | — |
| `shop_orders/{oid}` | `{ userId, items, total, date }` | `date`, `userId` |

## 5. 핵심 기능

### 5.1 회원
- 이메일/비밀번호로 가입·로그인 (SHA-256 해시 저장)
- LocalStorage 에 세션 (`altroshop_user`) — altroboard 와 동일 패턴
- 신규 회원은 0 코인으로 시작
- 관리자 백업 계정: `altrofast11x2@email.com` / `altrofast11x2@` (환경변수)

### 5.2 상품 등록
- 로그인 사용자만 가능
- 드래그앤드롭 또는 클릭 업로드
- Canvas 로 자동 리사이즈 (max 1200px, JPEG 0.82)
- Base64 로 Realtime DB 저장

### 5.3 댓글 & 좋아요
- 로그인 필수
- 좋아요는 `likes/{uid}:true` 패턴 (1인 1회 보장)
- 댓글은 `shop_comments/{pid}/{cid}` 트리

### 5.4 장바구니
- 사용자별 격리 (`shop_carts/{uid}/{pid}`)
- 수량 ± 변경, 개별/전체 삭제
- 결제 시 보유 코인 검증 → 차감 → `shop_orders` 기록 → 장바구니 비우기

### 5.5 코인 시스템 (관리자)
- `/admin` 에서 사용자별 코인 무한 충전 가능
- "+ 충전" 버튼 = 현재값에 더하기
- "설정" 버튼 = 입력값으로 덮어쓰기
- 통계: 사용자/상품/결제/유통 코인 합계

## 6. 배포

1. Vercel CLI 로 production 배포
2. 환경변수는 Vercel 대시보드에 동일하게 등록 (Firebase + ADMIN_ID/PW)
3. Firebase 콘솔에 `database.rules.json` 의 `shop_*` 규칙 반영 필요 (altroboard 기존 규칙은 유지)

## 7. 개발 단계 (3단계 분할)

✅ 1단계: 계획서 (본 문서)
✅ 2단계: 상품 / 댓글 / 장바구니 (Next.js + Firebase)
✅ 3단계: 코인 충전 + 결제 시스템
🚧 추가: Vercel 배포
