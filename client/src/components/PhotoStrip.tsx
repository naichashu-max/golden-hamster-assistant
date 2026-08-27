// 最近照片：横向滚动展示成长相册。
import type { GrowthPhoto } from '../types';

export function PhotoStrip({ photos }: { photos: GrowthPhoto[] }) {
  if (photos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📷</span>
        还没有照片，记录下第一张吧
      </div>
    );
  }

  return (
    <div className="photo-strip">
      {photos.map((photo) => (
        <img key={photo.id} src={photo.photo} alt={photo.caption ?? '成长照片'} />
      ))}
    </div>
  );
}
