import React from "react";
import { Image } from "@/components/ui/image";

const LOGO = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/02e81d056_logo.png";

// Auth shell: the same brand lockup the site uses, so signing in doesn't look
// like leaving the product. Presentation only — every auth flow is unchanged.
export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ri-ivory px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src={LOGO} alt="Same Day Recycling" className="mx-auto mb-5 h-12 w-auto" fittingType="fit" />
          <h1 className="text-3xl font-bold tracking-tight text-ri-charcoal">{title}</h1>
          {subtitle && <p className="text-ri-slate mt-2">{subtitle}</p>}
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-si-line p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-ri-slate mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}