// Decorative Aurora Glass lighting layer: soft emerald/cyan light blobs over a
// faint network-grid weave. Purely visual — never interactive, never blocking.
export default function AuroraBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-grid-overlay absolute inset-0" />
      <div className="aurora-blob absolute -top-24 -left-20 w-72 h-72" />
      <div className="aurora-blob aurora-blob--cyan absolute -top-10 -right-10 w-80 h-80" style={{ animationDelay: "-7s" }} />
      <div className="aurora-blob absolute top-72 left-1/3 w-64 h-64" style={{ animationDelay: "-3s", opacity: 0.6 }} />
    </div>
  );
}