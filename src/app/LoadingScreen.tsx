export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="skeleton h-8 w-32"></div>
    </div>
  );
}
