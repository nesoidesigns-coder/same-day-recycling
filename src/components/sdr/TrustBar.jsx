const items = [
  "Same-day pickups",
  "Upfront pricing from $139",
  "Service in English, French, Spanish, Mandarin, Tagalog",
  "(604) 849-1745",
];

export default function TrustBar() {
  return (
    <section className="bg-[#0c3b24] text-white">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {items.map((b, i) => (
          <div key={b} className="flex items-center gap-2 text-sm md:text-base font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#1d9e56]" />
            {b}
          </div>
        ))}
      </div>
    </section>
  );
}