import { Camera, MessageSquareText, CheckCircle2, ArrowRight } from "lucide-react";

const steps = [
  { icon: Camera, title: "Snap a photo", text: "Take a quick picture of the junk you need gone — one shot is enough." },
  { icon: MessageSquareText, title: "Text it to us", text: "Send it to (604) 849-1745. No phone calls, no forms, no waiting on hold." },
  { icon: CheckCircle2, title: "Get your quote", text: "We text back a firm price fast. Like it? Book the pickup — often same day." },
];

export default function TextPhotoQuote() {
  return (
    <section id="text-a-photo" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">No phone calls, no forms</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Text-a-Photo quoting</h2>
          <p className="mt-4 text-slate-600">
            Hate long phone calls and quoting forms? Text a photo of your items and get a firm, no-surprise price back —
            most quotes arrive in minutes during business hours.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {steps.map((s) => (
            <div key={s.title} className="rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6">
              <span className="w-11 h-11 rounded-2xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5" />
              </span>
              <div className="font-bold text-[#0c3b24]">{s.title}</div>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href="sms:+16048491745"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-8 py-4 hover:bg-[#17a04c] transition-colors"
          >
            <MessageSquareText className="w-5 h-5" /> Text a photo for my quote
          </a>
          <a href="#photo-quote" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0c3b24] hover:text-[#1d9e56] transition-colors">
            Prefer to upload right here? Use photo quoting <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}