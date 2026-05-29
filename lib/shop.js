// AltroShop Firebase Realtime DB helpers
// 데이터는 altroboard 와 충돌하지 않게 모두 `shop_` 프리픽스 사용
import {
  ref, get, set, update, push, remove, query, orderByChild, equalTo,
} from 'firebase/database';
import { db } from './firebase';
import { hashPassword } from './security';

// ───────── USERS ─────────
// 규칙이 아직 게시 안 된 경우에도 무너지지 않도록 try/catch 로 감싸고 null 반환
export async function findUserByEmail(email) {
  const lower = String(email || '').toLowerCase();
  try {
    const snap = await get(query(ref(db, 'shop_users'), orderByChild('email'), equalTo(lower)));
    if (!snap.exists()) return null;
    const entries = Object.entries(snap.val());
    const [uid, u] = entries[0];
    return { uid, ...u };
  } catch (e) {
    // Permission denied / Index not defined 등 — 부드럽게 null 처리
    console.warn('[AltroShop] shop_users 조회 실패 (Firebase 규칙 미게시 가능성):', e?.message || e);
    return null;
  }
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
  try {
    const altroSnap = await get(query(ref(db, 'users'), orderByChild('email'), equalTo(lower)));
    if (altroSnap.exists()) {
      const entries = Object.entries(altroSnap.val());
      for (const [uid, u] of entries) {
        if (!u || typeof u.password !== 'string') continue;
        if (u.password !== hashed) continue;

        // AltroBoard 인증 성공! shop_users 미러는 쓰기 권한 없으면 생략(메모리상 세션만)
        let coins = 100;
        let isAdmin = false;
        let mirrorExisted = false;

        try {
          const mirrorSnap = await get(ref(db, `shop_users/${uid}`));
          if (mirrorSnap.exists()) {
            mirrorExisted = true;
            const m = mirrorSnap.val();
            coins = m.coins || 0;
            isAdmin = !!m.isAdmin;
            // 이름/비번 동기화 시도 (실패해도 무시)
            try {
              await update(ref(db, `shop_users/${uid}`), {
                name: u.name || m.name,
                password: hashed,
              });
            } catch {}
          }
        } catch {
          // shop_users 권한 없음 — 메모리상 세션만 부여 (코인 100 보너스)
          console.warn('[AltroShop] shop_users 미러 조회 실패 — Firebase 규칙 게시 필요');
        }

        if (!mirrorExisted) {
          // 미러 생성 시도 (권한 없으면 silently skip)
          try {
            await set(ref(db, `shop_users/${uid}`), {
              name: u.name || '익명',
              email: lower,
              password: hashed,
              coins: 100,
              isAdmin: false,
              fromAltroboard: true,
              createdAt: u.createdAt || new Date().toISOString(),
              linkedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('[AltroShop] shop_users 미러 생성 실패 — Firebase 규칙 게시 필요:', e?.message || e);
          }
        }

        return {
          id: uid,
          name: u.name || '익명',
          email: lower,
          isAdmin,
          coins,
          source: mirrorExisted ? 'altroboard:linked' : 'altroboard:new',
        };
      }
    }
  } catch (e) {
    console.warn('[AltroShop] altroboard users 조회 실패:', e?.message || e);
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
    return { id: 'admin', name: '관리자', email: 'altrofast11x2@email.com', isAdmin: true, coins: 999999999 };
  }
  try {
    const snap = await get(ref(db, `shop_users/${uid}`));
    if (snap.exists()) {
      const u = snap.val();
      return { id: uid, name: u.name, email: u.email, isAdmin: !!u.isAdmin, coins: u.coins || 0 };
    }
  } catch (e) {
    console.warn('[AltroShop] getUser 실패 — Firebase 규칙 미게시 가능성:', e?.message || e);
  }
  // 폴백: altroboard 의 users/ 에서라도 정보 가져오기
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) {
      const u = snap.val();
      return { id: uid, name: u.name || '익명', email: u.email || '', isAdmin: false, coins: 0 };
    }
  } catch {}
  return null;
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
  try {
    const snap = await get(ref(db, 'shop_products'));
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, p]) => ({
      id,
      ...p,
      likeCount: p.likes ? Object.keys(p.likes).length : 0,
    })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (e) {
    console.warn('[AltroShop] listProducts 실패 — Firebase 규칙 미게시:', e?.message || e);
    return [];
  }
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

// 상품 수정 (판매자/관리자만 호출 보장은 UI 책임)
export async function updateProduct(pid, patch) {
  const allowed = {};
  if (patch.name  !== undefined) allowed.name  = patch.name;
  if (patch.desc  !== undefined) allowed.desc  = patch.desc;
  if (patch.price !== undefined) allowed.price = Number(patch.price);
  if (patch.image !== undefined) allowed.image = patch.image;
  allowed.updatedAt = new Date().toISOString();
  await update(ref(db, `shop_products/${pid}`), allowed);
  return getProduct(pid);
}

// 특정 판매자의 상품만 조회
export async function listProductsBySeller(uid) {
  try {
    const all = await listProducts();
    return all.filter(p => p.sellerId === uid);
  } catch {
    return [];
  }
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

// ───────── COIN REQUESTS (관리자에게 충전 요청) ─────────
// 데이터: shop_coin_requests/{id}: { userId, userName, userEmail, amount, message, status, createdAt, resolvedAt?, adminReply? }
// status: 'pending' | 'approved' | 'rejected'
export async function createCoinRequest({ userId, userName, userEmail, amount, message }) {
  const newRef = push(ref(db, 'shop_coin_requests'));
  const r = {
    userId, userName, userEmail,
    amount: Number(amount),
    message: String(message || '').slice(0, 500),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await set(newRef, r);
  return { id: newRef.key, ...r };
}

export async function listCoinRequests({ userId = null, status = null } = {}) {
  try {
    const snap = await get(ref(db, 'shop_coin_requests'));
    if (!snap.exists()) return [];
    let arr = Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }));
    if (userId) arr = arr.filter(r => r.userId === userId);
    if (status) arr = arr.filter(r => r.status === status);
    return arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch {
    return [];
  }
}

export async function approveCoinRequest(reqId, adminReply = '') {
  const snap = await get(ref(db, `shop_coin_requests/${reqId}`));
  if (!snap.exists()) return { error: '요청을 찾을 수 없습니다' };
  const r = snap.val();
  if (r.status !== 'pending') return { error: '이미 처리된 요청입니다' };

  // 코인 지급
  const user = await getUser(r.userId);
  if (!user) return { error: '사용자를 찾을 수 없습니다' };
  await updateUserCoins(r.userId, (user.coins || 0) + Number(r.amount));

  await update(ref(db, `shop_coin_requests/${reqId}`), {
    status: 'approved',
    resolvedAt: new Date().toISOString(),
    adminReply: String(adminReply || '').slice(0, 300),
  });
  return { ok: true };
}

export async function rejectCoinRequest(reqId, adminReply = '') {
  const snap = await get(ref(db, `shop_coin_requests/${reqId}`));
  if (!snap.exists()) return { error: '요청을 찾을 수 없습니다' };
  if (snap.val().status !== 'pending') return { error: '이미 처리된 요청입니다' };

  await update(ref(db, `shop_coin_requests/${reqId}`), {
    status: 'rejected',
    resolvedAt: new Date().toISOString(),
    adminReply: String(adminReply || '').slice(0, 300),
  });
  return { ok: true };
}

// ───────── CHECKOUT 안전결제 (Escrow) ─────────
// status: 'in_escrow' → 'completed' (buyer confirms) → coins to seller
//                    → 'refunded' (admin refunds buyer)
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
    items.push({
      productId: p.id, name: p.name, price: p.price, qty: c.qty,
      sellerId: p.sellerId, sellerName: p.sellerName, image: p.image,
    });
  }
  if (items.length === 0) return { error: '구매할 상품이 없습니다' };
  if ((user.coins || 0) < total) return { error: `코인 부족 (필요: ${total}, 보유: ${user.coins || 0})` };

  // 구매자 코인 차감 (에스크로 보관 시작)
  await updateUserCoins(uid, (user.coins || 0) - total);

  // 안전결제 주문 생성 (status: in_escrow)
  const newRef = push(ref(db, 'shop_orders'));
  const order = {
    userId: uid,
    buyerName: user.name,
    items, total,
    status: 'in_escrow',
    date: new Date().toISOString(),
  };
  await set(newRef, order);

  await clearCart(uid);
  return { ok: true, total, remaining: (user.coins || 0) - total, orderId: newRef.key };
}

// 구매자가 수령 후 "구매 확정" — 판매자에게 정산
export async function confirmOrder(orderId, buyerId) {
  const snap = await get(ref(db, `shop_orders/${orderId}`));
  if (!snap.exists()) return { error: '주문을 찾을 수 없습니다' };
  const o = snap.val();
  if (o.userId !== buyerId) return { error: '본인 주문이 아닙니다' };
  if (o.status !== 'in_escrow') return { error: '이미 처리된 주문입니다' };

  // 판매자별로 정산
  const sellerTotals = {};
  for (const item of o.items) {
    if (!item.sellerId) continue;
    sellerTotals[item.sellerId] = (sellerTotals[item.sellerId] || 0) + item.price * item.qty;
  }
  for (const [sellerId, amount] of Object.entries(sellerTotals)) {
    try {
      const seller = await getUser(sellerId);
      if (seller) await updateUserCoins(sellerId, (seller.coins || 0) + amount);
    } catch (e) { console.warn('판매자 정산 실패', sellerId, e); }
  }

  await update(ref(db, `shop_orders/${orderId}`), {
    status: 'completed',
    confirmedAt: new Date().toISOString(),
  });
  return { ok: true };
}

// 구매자가 환불 요청 (관리자가 처리)
export async function requestRefund(orderId, buyerId, reason = '') {
  const snap = await get(ref(db, `shop_orders/${orderId}`));
  if (!snap.exists()) return { error: '주문을 찾을 수 없습니다' };
  const o = snap.val();
  if (o.userId !== buyerId) return { error: '본인 주문이 아닙니다' };
  if (o.status !== 'in_escrow') return { error: '이미 처리된 주문입니다' };

  await update(ref(db, `shop_orders/${orderId}`), {
    status: 'refund_requested',
    refundReason: String(reason || '').slice(0, 300),
    refundRequestedAt: new Date().toISOString(),
  });
  return { ok: true };
}

// 관리자가 환불 승인
export async function approveRefund(orderId, adminReply = '') {
  const snap = await get(ref(db, `shop_orders/${orderId}`));
  if (!snap.exists()) return { error: '주문을 찾을 수 없습니다' };
  const o = snap.val();
  if (!['in_escrow', 'refund_requested'].includes(o.status)) return { error: '환불 불가 상태입니다' };

  // 구매자에게 코인 반환
  const buyer = await getUser(o.userId);
  if (buyer) await updateUserCoins(o.userId, (buyer.coins || 0) + o.total);

  await update(ref(db, `shop_orders/${orderId}`), {
    status: 'refunded',
    refundedAt: new Date().toISOString(),
    adminReply: String(adminReply || '').slice(0, 300),
  });
  return { ok: true };
}
