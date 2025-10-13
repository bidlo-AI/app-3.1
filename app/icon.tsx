import { ImageResponse } from 'next/og';

// Generate a small favicon so /favicon.ico doesn't hit dynamic routes
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          color: '#111111',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: -0.5,
        }}
      >
        B
      </div>
    ),
    size,
  );
}
