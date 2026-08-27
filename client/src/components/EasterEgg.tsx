// 隐藏彩蛋：连续轻点右上角透明区域 5 次，会出现一个字。
// 对普通用户完全不可见，只作为留给开发者的小惊喜。
import { useRef, useState } from 'react';

const TAP_THRESHOLD = 5;

export function EasterEgg() {
  const [visible, setVisible] = useState(false);
  const taps = useRef(0);
  const resetTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const handleTap = () => {
    taps.current += 1;
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      taps.current = 0;
    }, 2500);

    if (taps.current >= TAP_THRESHOLD) {
      taps.current = 0;
      setVisible(true);
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), 2600);
    }
  };

  return (
    <>
      <button
        type="button"
        className="hidden-easter-zone"
        aria-label="隐藏区域"
        onClick={handleTap}
      />
      {visible && (
        <div className="easter-toast" onClick={() => setVisible(false)}>
          <span className="easter-char">昕</span>
        </div>
      )}
    </>
  );
}
