// 通用卡片：统一标题、图标与右上角操作区。
import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Card({ title, icon, action, children }: CardProps) {
  return (
    <section className="card">
      {(title || action) && (
        <div className="card-title">
          {icon && <span aria-hidden>{icon}</span>}
          {title && <span>{title}</span>}
          {action && <span style={{ marginLeft: 'auto' }}>{action}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
