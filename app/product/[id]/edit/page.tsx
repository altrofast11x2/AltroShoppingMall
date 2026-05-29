'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProduct, updateProduct } from '@/lib/shop';
import { CATEGORIES } from '@/lib/categories';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [customCat, setCustomCat] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('altroshop_user');
    if (!raw) { router.replace('/login'); return; }
    const s = JSON.parse(raw);
    setUser(s);
    (async () => {
      const p = await getProduct(id);
      if (!p) { alert('상품을 찾을 수 없습니다'); router.replace('/'); return; }
      if (p.sellerId !== s.id && !s.isAdmin) {
        alert('본인이 등록한 상품만 수정할 수 있습니다');
        router.replace(`/product/${id}`);
        return;
      }
      setProduct(p);
      setName(p.name);
      setDesc(p.desc);
      setPrice(String(p.price || ''));
      setImage(p.image);
      // 기존 카테고리가 프리셋이면 선택, 아니면 직접입력으로
      const known = CATEGORIES.some(c => c.slug === p.category);
      if (p.category && known) setCategory(p.category);
      else if (p.category) { setCategory('__custom__'); setCustomCat(p.category); }
    })();
  }, [id, router]);

  const handleFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('이미지 파일만 가능합니다'); return; }
    if (file.size > 4 * 1024 * 1024) { setErr('이미지는 4MB 이하만 업로드 가능합니다'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        setImage(canvas.toDataURL('image/jpeg', 0.82));
        setErr('');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onPriceChange = (v: string) => setPrice(v.replace(/[^\d]/g, '').slice(0, 10));
  const priceDisplay = price ? Number(price).toLocaleString() : '';

  const submit = async () => {
    setErr('');
    if (!name.trim()) { setErr('상품명을 입력해주세요'); return; }
    const finalCat = category === '__custom__' ? customCat.trim() : category;
    if (!finalCat) { setErr('카테고리를 선택하거나 직접 입력해주세요'); return; }
    if (!desc.trim()) { setErr('상품 설명을 입력해주세요'); return; }
    const p = parseInt(price, 10);
    if (!p || p < 1) { setErr('가격은 1원 이상이어야 합니다'); return; }
    if (!image) { setErr('상품 사진이 필요합니다'); return; }

    setBusy(true);
    try {
      await updateProduct(id, {
        name: name.trim(), desc: desc.trim(), price: p, image, category: finalCat,
      });
      alert('수정 완료');
      router.push(`/product/${id}`);
    } catch (e: any) {
      setErr(e?.message || '수정 실패');
      setBusy(false);
    }
  };

  if (!user || !product) return <main className="bj-main">로딩 중...</main>;

  return (
    <main className="bj-main" style={{ maxWidth: 720 }}>
      <Link href={`/product/${id}`} className="bj-back-link">← 상품으로 돌아가기</Link>
      <h1 className="bj-page-title">상품 수정</h1>
      <p className="bj-page-sub">변경 사항은 즉시 반영됩니다</p>

      {err && <div className="bj-alert bj-alert-error">{err}</div>}

      <div className="bj-field">
        <label>상품 사진</label>
        <div
          className={`bj-drop ${dragOver ? 'over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          onClick={() => fileRef.current?.click()}
        >
          {image ? (
            <img src={image} alt="미리보기"/>
          ) : (
            <div className="bj-drop-text">클릭 또는 드래그해서 사진 변경<br/><strong>JPG / PNG / WebP</strong></div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}/>
        </div>
      </div>

      <div className="bj-field">
        <label>상품명</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60}/>
      </div>

      <div className="bj-field">
        <label>카테고리</label>
        <select className="bj-select" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">카테고리 선택</option>
          {CATEGORIES.map(c => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
          <option value="__custom__">직접 입력...</option>
        </select>
        {category === '__custom__' && (
          <input
            type="text"
            value={customCat}
            onChange={e => setCustomCat(e.target.value)}
            maxLength={20}
            placeholder="카테고리를 직접 입력 (예: 캠핑용품)"
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      <div className="bj-field">
        <label>상품 설명</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={600}/>
      </div>

      <div className="bj-field">
        <label>가격 (원)</label>
        <input type="text" inputMode="numeric" value={priceDisplay} onChange={e => onPriceChange(e.target.value)} placeholder="예) 440,000"/>
        {price && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>구매 시 {Number(price).toLocaleString()} 코인 차감</p>}
      </div>

      <div className="bj-form-actions">
        <button className="bj-btn bj-btn-cancel" onClick={() => router.push(`/product/${id}`)} disabled={busy}>취소</button>
        <button className="bj-btn bj-btn-primary bj-btn-grow" onClick={submit} disabled={busy}>
          {busy ? '저장 중...' : '변경사항 저장'}
        </button>
      </div>
    </main>
  );
}
