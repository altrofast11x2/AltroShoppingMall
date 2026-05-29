'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getProduct, listComments, addComment, toggleLike, addToCart, deleteProduct, getUser,
} from '@/lib/shop';

const Ico: any = {
  Heart: (p: any) => <svg viewBox="0 0 24 24" fill={p.fill || 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Share: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Chat: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
};

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showBuy, setShowBuy] = useState(false);

  const refresh = async () => {
    const p = await getProduct(id);
    setProduct(p);
    const cs = await listComments(id);
    setComments(cs);
    setLoading(false);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('altroshop_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    refresh();
  }, [id]);

  const requireLogin = () => {
    if (!user) {
      alert('로그인이 필요합니다');
      router.push('/login');
      return false;
    }
    return true;
  };

  const liked = user && product?.likes && product.likes[user.id];
  const isOwner = user && product && user.id === product.sellerId;

  const onToggleLike = async () => {
    if (!requireLogin()) return;
    await toggleLike(id, user.id);
    await refresh();
  };

  const onAddComment = async () => {
    if (!requireLogin()) return;
    if (!commentText.trim()) return;
    setBusy(true);
    await addComment(id, { authorId: user.id, authorName: user.name, text: commentText.trim() });
    setCommentText('');
    await refresh();
    setBusy(false);
  };

  const onBuyClick = async () => {
    if (!requireLogin()) return;
    // 최신 코인 잔액 받아오기
    const fresh = await getUser(user.id);
    if (fresh) {
      const merged = { ...user, coins: fresh.coins };
      setUser(merged);
      localStorage.setItem('altroshop_user', JSON.stringify(merged));
    }
    setShowBuy(true);
  };

  const onConfirmBuy = async () => {
    if (!requireLogin()) return;
    if ((user.coins || 0) < product.price) {
      alert('코인이 부족합니다. 코인 충전을 요청해주세요.');
      router.push('/coin-request');
      return;
    }
    await addToCart(user.id, id, 1);
    setShowBuy(false);
    window.dispatchEvent(new Event('altroshop:refresh'));
    if (confirm('장바구니에 담았습니다.\n장바구니에서 안전결제로 진행하시겠습니까?')) {
      router.push('/cart');
    }
  };

  const onShare = async () => {
    const url = window.location.href;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: product.name, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); alert('링크가 복사되었습니다'); } catch {}
  };

  const onDeleteProduct = async () => {
    if (!confirm(`"${product.name}" 을(를) 삭제하시겠습니까?\n(댓글/좋아요도 함께 삭제됩니다)`)) return;
    await deleteProduct(id);
    alert('삭제되었습니다');
    router.push('/profile');
  };

  if (loading) return <main className="bj-detail-wrap"><div className="bj-empty">불러오는 중...</div></main>;
  if (!product) return <main className="bj-detail-wrap"><div className="bj-empty">상품을 찾을 수 없습니다.</div></main>;

  const fmt = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 24) return h + '시간 전';
    return Math.floor(h / 24) + '일 전';
  };

  return (
    <main className="bj-detail-wrap">
      <nav className="bj-breadcrumb">
        <Link href="/">홈</Link>
        <span className="bj-breadcrumb-sep">›</span>
        <span style={{ color: 'var(--text)' }}>상품</span>
      </nav>

      <div className="bj-detail">
        <div className="bj-detail-image-wrap">
          <div className="bj-detail-image">
            {product.image && <img src={product.image} alt={product.name}/>}
          </div>
        </div>

        <div className="bj-detail-info">
          <div className="bj-detail-title-row">
            <h1 className="bj-detail-title">{product.name}</h1>
            <a className="bj-detail-report" href="#">신고하기</a>
          </div>

          <div>
            <div className="bj-detail-price">{Number(product.price).toLocaleString()}원</div>
            <div className="bj-detail-price-coin">결제 시 {Number(product.price).toLocaleString()} 코인 차감</div>
          </div>

          <div className="bj-detail-meta">
            <span className="bj-detail-meta-item">{fmt(product.createdAt)}</span>
            <span>·</span>
            <span className="bj-detail-meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {product.likeCount}
            </span>
            <span>·</span>
            <span className="bj-detail-meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              {comments.length}
            </span>
          </div>

          <dl className="bj-info-table">
            <dt>판매자</dt>
            <dd>{product.sellerName}</dd>
            <dt>상품상태</dt>
            <dd>{product.updatedAt ? '재등록 / 수정됨' : '새 상품'}</dd>
            <dt>수량</dt>
            <dd>1개</dd>
          </dl>

          <div className="bj-detail-desc">{product.desc}</div>

          <div className="bj-detail-info-block">
            <div className="bj-detail-section-title">안전결제 (에스크로)</div>
            <div className="muted" style={{ lineHeight: 1.6 }}>
              구매하면 결제 코인이 즉시 차감되어 보관됩니다. 상품 수령 후 <strong>구매 확정</strong> 시 판매자에게 정산됩니다.
              문제가 있으면 <strong>환불 요청</strong>으로 관리자가 처리합니다.
            </div>
          </div>

          <div className="bj-detail-actions">
            <button className={`bj-icon-btn ${liked ? 'heart-on' : ''}`} onClick={onToggleLike} aria-label="찜">
              <Ico.Heart width={20} height={20} fill={liked ? 'currentColor' : 'none'}/>
            </button>
            <button className="bj-icon-btn" onClick={onShare} aria-label="공유">
              <Ico.Share width={20} height={20}/>
            </button>
            <a className="bj-icon-btn" href="#comments" aria-label="댓글">
              <Ico.Chat width={20} height={20}/>
            </a>
            {isOwner ? (
              <>
                <Link href={`/product/${id}/edit`} className="bj-buy-btn outline" style={{ flex: 1 }}>수정</Link>
                <button className="bj-buy-btn" style={{ background: 'var(--ink)' }} onClick={onDeleteProduct}>삭제</button>
              </>
            ) : (
              <button className="bj-buy-btn" onClick={onBuyClick}>구매하기</button>
            )}
          </div>
        </div>
      </div>

      <div className="bj-seller-card">
        <div className="bj-seller-avatar">{(product.sellerName || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div className="bj-seller-name">{product.sellerName}</div>
          <div className="bj-seller-meta">AltroShop 판매자</div>
        </div>
      </div>

      <section className="bj-comments" id="comments">
        <h3>댓글 {comments.length}</h3>
        {user ? (
          <div className="bj-comment-form">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAddComment()}
              placeholder="댓글을 입력하세요"
              maxLength={300}
            />
            <button onClick={onAddComment} disabled={busy}>등록</button>
          </div>
        ) : (
          <div className="bj-notice">
            댓글을 작성하려면 <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>로그인</Link> 해주세요.
          </div>
        )}

        {comments.length === 0 ? (
          <div className="bj-empty" style={{ padding: '32px 0' }}>아직 댓글이 없습니다.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bj-comment-item">
              <div className="bj-comment-head">
                <span className="bj-comment-author">{c.authorName}</span>
                <span className="bj-comment-date">{fmt(c.createdAt)}</span>
              </div>
              <div className="bj-comment-text">{c.text}</div>
            </div>
          ))
        )}
      </section>

      {/* 안전결제 모달 */}
      {showBuy && (
        <div className="bj-modal-overlay" onClick={() => setShowBuy(false)}>
          <div className="bj-modal" onClick={e => e.stopPropagation()}>
            <h3 className="bj-modal-title">안전결제로 구매하시겠습니까</h3>
            <div className="bj-modal-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
                <img src={product.image} style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover' }} alt=""/>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</div>
                  <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 16, marginTop: 2 }}>
                    {Number(product.price).toLocaleString()}원
                  </div>
                </div>
              </div>
              <div className="bj-notice" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>보유 코인</span>
                  <strong>{Number(user?.coins || 0).toLocaleString()}코인</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>결제 후 잔액</span>
                  <strong style={{ color: (user?.coins || 0) >= product.price ? 'var(--text)' : 'var(--accent)' }}>
                    {((user?.coins || 0) - product.price).toLocaleString()}코인
                  </strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  ※ 장바구니에 담은 뒤 안전결제로 진행됩니다
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="bj-btn bj-btn-block" onClick={() => setShowBuy(false)}>취소</button>
              <button className="bj-btn bj-btn-primary bj-btn-block" onClick={onConfirmBuy}>
                {(user?.coins || 0) >= product.price ? '장바구니로' : '코인 충전 요청'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
