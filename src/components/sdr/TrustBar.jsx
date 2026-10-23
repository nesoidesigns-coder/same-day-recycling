const items = [
  "Same-day slots before noon, where contractors are confirmed",
  "Upfront pricing from $139",
  "Service in English, French, Spanish, Mandarin, Tagalog",
  "(604) 849-1745",
];

export default function TrustBar() {
  return (
    <section className="bg-gold text-[#102B2A]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {items.map((b) => (
          <div key={b} className="flex items-center gap-2 text-sm md:text-base font-bold">
            <span className="w-2 h-2 rounded-full bg-[#102B2A]" />
            {b}
          </div>
        ))}
      </div>
    </section>
  );
}