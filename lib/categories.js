// AltroShop 공용 카테고리 정의
// slug = 내부 식별자 (상품 데이터에 저장), label = 표시 이름
// 헤더/드롭다운/업로드/필터 모두 이 목록을 공유한다.

export const CATEGORIES = [
  { slug: 'women',     label: '여성의류' },
  { slug: 'men',       label: '남성의류' },
  { slug: 'shoes',     label: '신발' },
  { slug: 'bag',       label: '가방/지갑' },
  { slug: 'accessory', label: '시계/주얼리' },
  { slug: 'beauty',    label: '뷰티' },
  { slug: 'digital',   label: '디지털/가전' },
  { slug: 'sports',    label: '스포츠/레저' },
  { slug: 'stargoods', label: '스타굿즈' },
  { slug: 'kidult',    label: '키덜트/취미' },
  { slug: 'book',      label: '도서/티켓/취미' },
  { slug: 'etc',       label: '기타' },
];

// 헤더 카테고리 바에 직접 노출할 주요 카테고리 (나머지는 "카테고리" 호버 드롭다운에서)
export const HEADER_CATEGORY_SLUGS = ['women', 'men', 'digital', 'sports', 'stargoods', 'kidult'];

export const slugToLabel = (slug) => {
  const found = CATEGORIES.find(c => c.slug === slug);
  return found ? found.label : slug;
};

export const labelToSlug = (label) => {
  const found = CATEGORIES.find(c => c.label === label);
  return found ? found.slug : null;
};
