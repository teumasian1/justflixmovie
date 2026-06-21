// Mirrors createStarRating() from the original videoModal.js: a 0-100 rating
// mapped to 5 stars (full / half / empty) using Font Awesome icons.

export default function StarRating({ rating }: { rating: number }) {
  const stars = Math.round((rating / 20) * 2) / 2; // 0-5, nearest half
  const icons = [];
  for (let i = 1; i <= 5; i++) {
    let cls = 'far fa-star';
    if (i <= stars) cls = 'fas fa-star';
    else if (i - 0.5 === stars) cls = 'fas fa-star-half-alt';
    icons.push(<i key={i} className={cls} />);
  }
  return <div className="rating">{icons}</div>;
}
