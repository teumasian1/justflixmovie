// Mirrors createStarRating() from the original videoModal.js: a 0-100 rating
// mapped to 5 stars (full / half / empty) using Font Awesome icons.

import Icon from './Icon';

export default function StarRating({ rating }: { rating: number }) {
  const stars = Math.round((rating / 20) * 2) / 2; // 0-5, nearest half
  const icons = [];
  for (let i = 1; i <= 5; i++) {
    let name: 'star' | 'star-half' | 'star-o' = 'star-o';
    if (i <= stars) name = 'star';
    else if (i - 0.5 === stars) name = 'star-half';
    icons.push(<Icon key={i} name={name} />);
  }
  return <div className="rating">{icons}</div>;
}
