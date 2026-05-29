'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProduct } from '@/lib/shop';
import { CATEGORIES } from '@/lib/categories';

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');          // 원시 숫자 문자열 ("10000")
  const [category, setCategory] = useState('');     // slug 또는 '__custom__'
  const [customCat, setCustomCat] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('altroshop_user');
    if (!raw) { router.replace('/login'); return; }
    setUser(JSON.parse(raw));
  }, [router]);

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

  // 가격 입력: 숫자만 남기고 표시할 땐 콤마 (10000 → 10,000)
  const onPriceChange = (v: string) => {
    const digits = v.replace(/[^\d]/g, '').slice(0, 10);
    setPrice(digits);
  };
  const priceDisplay = price ? Number(price).toLocaleString() : '';

  const submit = async () => {
    setErr('');
    if (!user) return;
    if (!image) { setErr('상품 사진을 업로드 해주세요'); return; }
    if (!name.trim()) { setErr('상품명을 입력해주세요'); return; }
    const finalCat = category === '__custom__' ? customCat.trim() : category;
    if (!finalCat) { setErr('카테고리를 선택하거나 직접 입력해주세요'); return; }
    if (!desc.trim()) { setErr('상품 설명을 입력해주세요'); return; }
    const p = parseInt(price, 10);
    if (!p || p < 1) { setErr('가격은 1원 이상이어야 합니다'); return; }

    setBusy(true);
    try {
      const result = await createProduct({
        sellerId: user.id, sellerName: user.name,
        name: name.trim(), desc: desc.trim(), price: p, image,
        category: finalCat,
      });
      router.push(`/product/${result.id}`);
    } catch (e: any) {
      setErr(e?.message || '등록 실패');
      setBusy(false);
    }
  };

  if (!user) return <main className="bj-main">로딩 중...</main>;

  return (
    <main className="bj-main" style={{ maxWidth: 720 }}>
      <Link href="/" className="bj-back-link">← 목록으로</Link>
      <h1 className="bj-page-title">상품 등록</h1>
      <p className="bj-page-sub">사진 + 카테고리 + 설명 + 가격을 입력하면 즉시 노출됩니다 (1원 = 1코인)</p>

      {err && <div className="bj-alert bj-alert-error">{err}</div>}

      <div className="bj-field">
        <label>상품 사진 (최대 4MB)</label>
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
            <div className="bj-drop-text">
              클릭 또는 드래그해서 사진을 추가하세요<br/>
              <strong>JPG / PNG / WebP</strong>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}/>
        </div>
      </div>

      <div className="bj-field">
        <label>상품명</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="예) 미개봉 새상품 아이패드 a16 128gb"/>
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
        <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={600} placeholder="상품의 특징, 상태, 거래방법 등을 자유롭게 작성하세요."/>
      </div>

      <div className="bj-field">
        <label>가격 (원)</label>
        <input
          type="text"
          inputMode="numeric"
          value={priceDisplay}
          onChange={e => onPriceChange(e.target.value)}
          placeholder="예) 440,000"
        />
        {price && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>구매 시 {Number(price).toLocaleString()} 코인 차감</p>}
      </div>

      <div className="bj-form-actions">
        <button className="bj-btn bj-btn-cancel" onClick={() => router.push('/')} disabled={busy}>취소</button>
        <button className="bj-btn bj-btn-primary bj-btn-grow" onClick={submit} disabled={busy}>
          {busy ? '등록 중...' : '상품 등록'}
        </button>
      </div>
    </main>
  );
}
