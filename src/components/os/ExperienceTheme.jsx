import { useLocation } from "react-router-dom";

// Presentation only: all routes retain their existing guards and page logic.
export default function ExperienceTheme({ children }) {
  const { pathname } = useLocation();
  const experience = pathname.startsWith("/admin") ? "admin"
    : ["/partners", "/finance", "/contractor-onboarding"].includes(pathname) ? "contractor"
    : ["/live", "/demand", "/adi", "/recycling-os", "/prototype-observatory"].includes(pathname) ? "intelligence"
    : ["/company", "/realtor-dashboard"].includes(pathname) ? "workspace" : "customer";
  return <div className="os-experience min-h-screen font-body" data-experience={experience}>{children}</div>;
}