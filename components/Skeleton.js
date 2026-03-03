import React from 'react';

// Generic skeleton block
export function Skeleton({ width = '100%', height = 16, style = {}, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width, height, ...style }} />;
}

// specific shapes
export function AvatarSkeleton() {
  return <Skeleton width={36} height={36} className="skeleton-avatar" style={{ borderRadius: '50%' }} />;
}

export function TextSkeleton({ lines = 2 }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} style={{ marginBottom: 6, width: `${90 - i * 10}%` }} />
      ))}
    </>
  );
}

export function PostSkeleton() {
  return (
    <div className="post-skeleton" style={{ padding:12, borderRadius:8, background:'#fff', marginBottom:12 }}>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <AvatarSkeleton />
        <Skeleton width="30%" height={12} />
      </div>
      <TextSkeleton lines={3} />
      <Skeleton height={150} style={{ marginTop:8 }} />
    </div>
  );
}

export function ContactSkeleton() {
  return (
    <div className="contact-item" style={{ opacity:0.5 }}>
      <div className="contact-avatar"><AvatarSkeleton /></div>
      <div style={{ flex:1, marginLeft:8 }}>
        <Skeleton width="60%" height={12} />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
      <AvatarSkeleton />
      <div style={{ flex:1 }}>
        <Skeleton width="40%" height={12} />
        <Skeleton width="80%" height={12} style={{ marginTop:4 }} />
      </div>
    </div>
  );
}

export function GroupSkeleton() {
  return (
    <div className="contact-item" style={{ opacity:0.5 }}>
      <div className="contact-avatar"><AvatarSkeleton /></div>
      <div style={{ flex:1, marginLeft:8 }}>
        <Skeleton width="60%" height={12} />
      </div>
    </div>
  );
}
