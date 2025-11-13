import ForestCanvas from '../components/ForestCanvas';

export default function Page() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0b1020 0%, #111a2e 40%, #0a120f 100%)' }}>
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '28px 16px 8px 16px', color: 'white' }}>
        <h1 style={{ fontSize: 'clamp(24px, 3vw, 44px)', margin: 0 }}>Ugly Trees in a Beautiful Forest</h1>
        <p style={{ opacity: 0.8, marginTop: 8 }}>Generative art. Reload for a new forest.</p>
      </div>
      <ForestCanvas />
      <footer style={{ position: 'fixed', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#c6d0f5', fontSize: 12, opacity: 0.7 }}>
        Crafted with Next.js Canvas ? Subtle animation, CPU-friendly
      </footer>
    </main>
  );
}
