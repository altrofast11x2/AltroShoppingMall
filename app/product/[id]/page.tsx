'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getProduct, listComments, addComment, toggleLike, addToCart, deleteProduct,
} from '@/lib/shop';

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const p = await getProduct(id);
    setProduct(p);
    const cs = await listComments(id);
    setComments(cs);
    setLoading(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem('altroshop_user');
    if (raw) setUser(JSON.parse(raw));
    refresh();
  }, [id]);

  const liked = user && product?.likes && product.likes[user.id];

  const onToggleLike = async () => {
    if (!user) { alert('로그인이 필요합니다'); router.push('/login'); return; }
    await toggleLike(id, user.id);
    await refresh();
  };

  const onAddComment = async () => {
    if (!user) { alert('로그인이 필요합니다'); router.push('/login'); return; }
    if (!commentText.trim()) return;
    setBusy(true);
    await addComment(id, { authorId: user.id, authorName: user.name, text: commentText.trim() });
    setCommentText('');
    await refresh();
    setBusy(false);
  };

  const onAddToCart = async () => {
    if (!user) { alert('로그인이 필요합니다'); router.push('/login'); return; }
    await addToCart(user.id, id, 1);
    window.dispatchEvent(new Event('altroshop:refresh'));
    alert('장바구니에 담았습니다!');
  };

  const onDeleteProduct = async () => {
    if (!confirm(`"${product.name}" 을(를) 삭제하시겠습니까?\n(댓글/좋아요도 함께 삭제됩니다)`)) return;
    await deleteProduct(id);
    alert('삭제되었습니다.');
    router.push('/profile');
  };

  if (loading) return <main className="page"><div className="container"><div className="empty">불러오는 중...</div></div></main>;
  if (!product) return <main className="page"><div className="container"><div className="empty">상품을 찾을 수 없습니다.</div></div></main>;

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <main className="page">
      <div className="container">
        <a href="/" className="back-link">← 목록으로</a>

        <div className="detail-grid">
          <div className="detail-image">
            {product.image && <img src={product.image} alt={product.name} />}
          </div>
          <div className="detail-info">
            <h1>{product.name}</h1>
            <div className="detail-seller">
              <span className="badge">판매자</span> @{product.sellerName} · {fmt(product.createdAt)}
            </div>
            <div className="detail-price">
              {Number(product.price).toLocaleString()}<span className="coin-suffix">코인</span>
            </div>
            <div className="detail-desc">{product.desc}</div>
            <div className="detail-actions">
              {user && user.id === product.sellerId ? (
                <>
                  <span className="badge badge-green" style={{padding:'.35rem .6rem',fontSize:'.72rem'}}>내가 등록한 상품</span>
                  <Link href={`/product/${product.id}/edit`} className="btn btn-primary">✎ 수정</Link>
                  <button className="btn btn-danger" onClick={onDeleteProduct}>🗑 삭제</button>
                  <span className="like-btn" style={{opacity:.5,cursor:'default'}} title="본인 상품">
                    ♡ <span>{product.likeCount}</span>
                  </span>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={onAddToCart}>🛒 장바구니 담기</button>
                  <button className={`like-btn ${liked ? 'on' : ''}`} onClick={onToggleLike}>
                    {liked ? '♥' : '♡'} <span>{product.likeCount}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="comments">
          <h3>💬 댓글 ({comments.length})</h3>
          {user ? (
            <div className="comment-form">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAddComment()}
                placeholder="댓글을 입력하세요..."
                maxLength={300}
              />
              <button className="btn btn-primary" onClick={onAddComment} disabled={busy}>등록</button>
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--mono)', fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              댓글을 작성하려면 <a href="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>로그인</a> 해주세요.
            </p>
          )}

          {comments.length === 0 ? (
            <div className="empty" style={{ padding: '1.5rem 0' }}>아직 댓글이 없습니다.</div>
          ) : (
            <div className="comment-list">
              {comments.map(c => (
                <div className="comment-item" key={c.id}>
                  <div className="comment-head">
                    <span className="comment-author">@{c.authorName}</span>
                    <span className="comment-date">{fmt(c.createdAt)}</span>
                  </div>
                  <div className="comment-text">{c.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
