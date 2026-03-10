/**
 * MeshFlow Gradient Mark - 'M' structure branching into a right-ward arrow.
 * Uses fill="currentColor" to adapt to theme (light/dark).
 */
export function MeshFlowLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 24" fill="currentColor" className={className} aria-hidden>
      {/* M shape */}
      <path d="M2 2v20h3V11l5 11h2l5-11v11h3V2h-3l-5 9-5-9H2z" />
      {/* Arrow branching right */}
      <path d="M22 10h2v4h4l-3 3 1.5 1.5L30 14h-6v-4z" />
    </svg>
  );
}
