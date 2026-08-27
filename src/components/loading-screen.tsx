export function LoadingScreen({
  label = "Preparing the next frame",
}: {
  label?: string;
}) {
  return (
    <div
      className="loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="loading-screen__glow" aria-hidden="true" />
      <div className="loading-screen__content">
        <div className="loading-screen__mark" aria-hidden="true">
          <span>AX7</span>
          <i>MOV</i>
        </div>
        <div className="loading-screen__track" aria-hidden="true">
          <span />
        </div>
        <p>{label}</p>
      </div>
    </div>
  );
}
