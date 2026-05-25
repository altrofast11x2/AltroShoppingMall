// AltroShop Firebase Realtime DB helpers
// 데이터는 altroboard 와 충돌하지 않게 모두 `shop_` 프리픽스 사용
import {
  ref, get, set, update, push, remove, query, orderByChild, equalTo,
} from 'firebase/database';
import { db } from './firebase';
import { hashPassword } from './security';

// ───────── USERS ─────────
export async function findUserByEmail(email) {
  const lower = String(email || '').toLowerCase();
  const snap = await get(query(ref(db, 'shop_users'), orderByChild('email'), equalTo(lower)));
  if (!snap.exists()) return null;
  const entries = Object.entries(snap.val());
  const [uid, u] = entries[0];
  return { uid, ...u };
}

// 관리자 (백업) — 환경변수가 클라이언트에 노출되지 않으므로 하드코딩
const ADMIN_EMAIL = 'altrofast11x2@email.com';
const ADMIN_PASSWORD = 'altrofast11x2@';

export async function loginUser(email, password) {
  const lower = String(email || '').toLowerCase();
  // 관리자 백업 계정
  if (lower === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return { id: 'admin', name: '관리자', email: lower, isAdmin: true, coins: 999999999 };
  }
  const hashed = await hashPassword(password, lower);

  // 1) AltroShop 자체 회원 먼저 시도
  const shopUser = await findUserByEmail(lower);
  if (shopUser && shopUser.password === hashed) {
    return {
      id: shopUser.uid,
      name: shopUser.name,
      email: shopUser.email,
      isAdmin: !!shopUser.isAdmin,
      coins: shopUser.coins || 0,
      source: 'shop',
    };
  }

  // 2) AltroBoard 계정 호환 (Meta 식 통합 로그인)
  //    altroboard 의 users/ 노드에서 같은 이메일+해시 매칭 시 자동 인증
  const altroSnap = await get(query(ref(db, 'users'), orderByChild('email'), equalTo(lower)));
  if (altroSnap.exists()) {
    const entries = Object.entries(altroSnap.val());
    for (const [uid, u] of entries) {
      if (!u || typeof u.password !== 'string') continue;
      if (u.password !== hashed) continue;

      // AltroBoard 계정으로 로그인 성공 → shop_users 미러 보장
      const mirrorSnap = await get(ref(db, `shop_users/${uid}`));
      if (!mirrorSnap.exists()) {
        // 첫 로그인 — 미러 생성 + 환영 보너스 100 코인
        const mirror = {
          name: u.name || '익명',
          email: lower,
          password: hashed,
          coins: 100,
          isAdmin: false,
          fromAltroboard: true,
          createdAt: u.createdAt || new Date().toISOString(),
          linkedAt: new Date().toISOString(),
        };
        await set(ref(db, `shop_users/${uid}`), mirror);
        return {
          id: uid,
          name: mirror.name,
          email: lower,
          isAdmin: false,
          coins: 100,
          source: 'altroboard:new',
        };
      } else {
        // 이미 미러 존재 — 기존 코인/관리자 권한 유지, 비번/이름은 altroboard 쪽 최신값으로 동기화
        const mirror = mirrorSnap.val();
        await update(ref(db, `shop_users/${uid}`), {
          name: u.name || mirror.name,
          password: hashed,
        });
        return {
          id: uid,
          name: u.name || mirror.name,
          email: lower,
          isAdmin: !!mirror.isAdmin,
          coins: mirror.coins || 0,
          source: 'altroboard:linked',
        };
      }
    }
  }

  return null;
}

export async function registerUser(name, email, password) {
  const lower = String(email).toLowerCase();
  if (await findUserByEmail(lower)) return { error: '이미 가입된 이메일입니다. 로그인 해주세요.' };

  // AltroBoard 에 같은 이메일이 있는 경우 안내 — 비밀번호도 동일하다면 그쪽 로그인 사용
  const altroSnap = await get(query(ref(db, 'users'), orderByChild('email'), equalTo(lower)));
  if (altroSnap.exists()) {
    return { error: 'AltroBoard 에 이미 가입된 이메일입니다. AltroBoard 비밀번호로 바로 로그인 해주세요.' };
  }

  const hashed = await hashPassword(password, lower);
  const newRef = push(ref(db, 'shop_users'));
  const user = {
    name, email: lower, password: hashed,
    coins: 0,
    isAdmin: false,
    createdAt: new Date().toISOString(),
  };
  await set(newRef, user);
  return {
    id: newRef.key,
    name, email: lower,
    isAdmin: false,
    coins: 0,
  };
}

export async function getUser(uid) {
  if (uid === 'admin') {
    return { id: 'admin', name: '관리자', email: process.env.NEXT_PUBLIC_ADMIN_ID || 'admin', isAdmin: true, coins: 999999999 };
  }
  const snap = await get(ref(db, `shop_users/${uid}`));
  if (!snap.exists()) return null;
  const u = snap.val();
  return { id: uid, name: u.name, email: u.email, isAdmin: !!u.isAdmin, coins: u.coins || 0 };
}

export async function listUsers() {
  const snap = await get(ref(db, 'shop_users'));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([uid, u]) => ({
    id: uid,
    name: u.name,
    email: u.email,
    coins: u.coins || 0,
    isAdmin: !!u.isAdmin,
    createdAt: u.createdAt,
  })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function updateUserCoins(uid, coins) {
  if (uid === 'admin') return true;
  await update(ref(db, `shop_users/${uid}`), { coins: Math.max(0, Number(coins) || 0) });
  return true;
}

// ───────── PRODUCTS ─────────
export async function createProduct({ sellerId, sellerName, name, desc, price, image }) {
  const newRef = push(ref(db, 'shop_products'));
  const product = {
    sellerId, sellerName,
    name, desc,
    price: Number(price),
    image,
    likes: {},
    createdAt: new Date().toISOString(),
  };
  await set(newRef, product);
  return { id: newRef.key, ...product };
}

export async function listProducts() {
  const snap = await get(ref(db, 'shop_products'));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, p]) => ({
    id,
    ...p,
    likeCount: p.likes ? Object.keys(p.likes).length : 0,
  })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getProduct(pid) {
  const snap = await get(ref(db, `shop_products/${pid}`));
  if (!snap.exists()) return null;
  const p = snap.val();
  return {
    id: pid,
    ...p,
    likeCount: p.likes ? Object.keys(p.likes).length : 0,
  };
}

export async function deleteProduct(pid) {
  await remove(ref(db, `shop_products/${pid}`));
  await remove(ref(db, `shop_comments/${pid}`));
  return true;
}

export async function toggleLike(pid, uid) {
  const snap = await get(ref(db, `shop_products/${pid}/likes/${uid}`));
  if (snap.exists()) {
    await remove(ref(db, `shop_products/${pid}/likes/${uid}`));
    return { liked: false };
  } else {
    await set(ref(db, `shop_products/${pid}/likes/${uid}`), true);
    return { liked: true };
  }
}

// ───────── COMMENTS ─────────
export async function listComments(pid) {
  const snap = await get(ref(db, `shop_comments/${pid}`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

export async function addComment(pid, { authorId, authorName, text }) {
  const newRef = push(ref(db, `shop_comments/${pid}`));
  const c = {
    authorId, authorName, text,
    createdAt: new Date().toISOString(),
  };
  await set(newRef, c);
  return { id: newRef.key, ...c };
}

export async function deleteComment(pid, cid) {
  await remove(ref(db, `shop_comments/${pid}/${cid}`));
  return true;
}

// ───────── CART ─────────
export async function getCart(uid) {
  const snap = await get(ref(db, `shop_carts/${uid}`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([productId, v]) => ({
    productId,
    qty: typeof v === 'object' ? (v.qty || 1) : Number(v) || 1,
  }));
}

export async function addToCart(uid, pid, qty = 1) {
  const cur = await get(ref(db, `shop_carts/${uid}/${pid}`));
  const curQty = cur.exists() ? (typeof cur.val() === 'object' ? (cur.val().qty || 1) : Number(cur.val()) || 1) : 0;
  await set(ref(db, `shop_carts/${uid}/${pid}`), { qty: curQty + qty });
  return true;
}

export async function setCartQty(uid, pid, qty) {
  if (qty < 1) {
    await remove(ref(db, `shop_carts/${uid}/${pid}`));
  } else {
    await set(ref(db, `shop_carts/${uid}/${pid}`), { qty });
  }
  return true;
}

export async function removeFromCart(uid, pid) {
  await remove(ref(db, `shop_carts/${uid}/${pid}`));
  return true;
}

export async function clearCart(uid) {
  await remove(ref(db, `shop_carts/${uid}`));
  return true;
}

// ───────── ORDERS ─────────
export async function createOrder(uid, items, total) {
  const newRef = push(ref(db, 'shop_orders'));
  const order = {
    userId: uid,
    items,
    total,
    date: new Date().toISOString(),
  };
  await set(newRef, order);
  return { id: newRef.key, ...order };
}

export async function listOrders(uid = null) {
  const snap = await get(ref(db, 'shop_orders'));
  if (!snap.exists()) return [];
  const all = Object.entries(snap.val()).map(([id, o]) => ({ id, ...o }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return uid ? all.filter(o => o.userId === uid) : all;
}

// ───────── CHECKOUT (트랜잭션 흉내) ─────────
export async function checkout(uid) {
  const user = await getUser(uid);
  if (!user) return { error: '로그인이 필요합니다' };
  const cart = await getCart(uid);
  if (cart.length === 0) return { error: '장바구니가 비어있습니다' };

  let total = 0;
  const items = [];
  for (const c of cart) {
    const p = await getProduct(c.productId);
    if (!p) continue;
    total += p.price * c.qty;
    items.push({ productId: p.id, name: p.name, price: p.price, qty: c.qty });
  }
  if (items.length === 0) return { error: '구매할 상품이 없습니다' };
  if ((user.coins || 0) < total) return { error: `코인 부족 (필요: ${total}, 보유: ${user.coins || 0})` };

  await updateUserCoins(uid, (user.coins || 0) - total);
  await createOrder(uid, items, total);
  await clearCart(uid);
  return { ok: true, total, remaining: (user.coins || 0) - total };
}
