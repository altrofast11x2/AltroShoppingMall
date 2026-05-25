'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/shop';

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
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
      // Resize/compress through canvas
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setImage(dataUrl);
        setErr('');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setErr('');
    if (!user) return;
    if (!image) { setErr('상품 사진을 업로드 해주세요'); return; }
    if (!name.trim()) { setErr('상품명을 입력해주세요'); return; }
    if (!desc.trim()) { setErr('상품 설명을 입력해주세요'); return; }
    const p = parseInt(price, 10);
    if (!p || p < 1) { setErr('가격은 1코인 이상이어야 합니다'); return; }

    setBusy(true);
    try {
      const result = await createProduct({
        sellerId: user.id,
        sellerName: user.name,
        name: name.trim(),
        desc: desc.trim(),
        price: p,
        image,
      });
      router.push(`/product/${result.id}`);
    } catch (e: any) {
      setErr(e?.message || '등록 실패');
      setBusy(false);
    }
  };

  if (!user) return <main className="page"><div className="container">로딩 중...</div></main>;

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <a href="/" className="back-link">← 목록으로</a>
        <div className="section-header">
          <div>
            <h2>상품 등록</h2>
            <p>사진 + 설명 + 가격을 입력하면 즉시 노출됩니다.</p>
          </div>
        </div>

        <div className="card card-accent">
          {err && <div className="alert alert-error">{err}</div>}

          <div className="form-group">
            <label>상품 사진 (최대 4MB)</label>
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileRef.current?.click()}
            >
              {image ? (
                <img src={image} className="drop-preview" alt="미리보기" />
              ) : (
                <div className="drop-zone-text">
                  📷 클릭하거나 드래그해서 사진을 추가하세요<br />
                  <strong>JPG / PNG / WebP</strong> · 최대 4MB
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            {image && (
              <button className="btn btn-sm" style={{ marginTop: '.5rem' }} onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ''; }}>
                사진 제거
              </button>
            )}
          </div>

          <div className="form-group">
            <label>상품명</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="예) 핸드메이드 가죽 지갑" />
          </div>

          <div className="form-group">
            <label>상품 설명</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={600} placeholder="상품의 특징, 재료, 크기 등을 자유롭게 작성하세요." />
          </div>

          <div className="form-group">
            <label>가격 (코인)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} min={1} placeholder="예) 100" />
          </div>

          <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
            <button className="btn" onClick={() => router.push('/')} disabled={busy}>취소</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={busy}>
              {busy ? '등록 중...' : '상품 등록'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
