const badges = ["Same-day pickup", "Upfront pricing", "Eco-friendly disposal", "Licensed & insured"];

export default function TrustBar() {
  return (
    <section className="bg-[#0c3b24] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((b) => (
          <div key={b} className="flex items-center justify-center gap-2 text-sm md:text-base font-semibold text-center">
            <span className="w-2 h-2 rounded-full bg-[#1d9e56]" />
            {b}
          </div>
        ))}
      </div>
    </section>
  );
}