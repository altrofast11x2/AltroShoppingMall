'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getProduct, updateProduct } from '@/lib/shop';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
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
      setPrice(String(p.price));
      setImage(p.image);
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

  const submit = async () => {
    setErr('');
    if (!name.trim()) { setErr('상품명을 입력해주세요'); return; }
    if (!desc.trim()) { setErr('상품 설명을 입력해주세요'); return; }
    const p = parseInt(price, 10);
    if (!p || p < 1) { setErr('가격은 1코인 이상이어야 합니다'); return; }
    if (!image) { setErr('상품 사진이 필요합니다'); return; }

    setBusy(true);
    try {
      await updateProduct(id, {
        name: name.trim(), desc: desc.trim(), price: p, image,
      });
      alert('수정 완료');
      router.push(`/product/${id}`);
    } catch (e: any) {
      setErr(e?.message || '수정 실패');
      setBusy(false);
    }
  };

  if (!user || !product) return <main className="page"><div className="container">로딩 중...</div></main>;

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <a href={`/product/${id}`} className="back-link">← 상품으로 돌아가기</a>
        <div className="section-header">
          <div>
            <h2>상품 수정</h2>
            <p>변경 사항은 즉시 반영됩니다</p>
          </div>
        </div>

        <div className="card card-accent">
          {err && <div className="alert alert-error">{err}</div>}

          <div className="form-group">
            <label>상품 사진</label>
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
                <div className="drop-zone-text">📷 클릭하거나 드래그해서 사진 변경</div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </div>

          <div className="form-group">
            <label>상품명</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60} />
          </div>

          <div className="form-group">
            <label>상품 설명</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={600} />
          </div>

          <div className="form-group">
            <label>가격 (코인)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} min={1} />
          </div>

          <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
            <button className="btn" onClick={() => router.push(`/product/${id}`)} disabled={busy}>취소</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={busy}>
              {busy ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
