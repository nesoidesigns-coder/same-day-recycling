import { Navigate, useParams } from "react-router-dom";

// Legacy city URLs (e.g. /city/vancouver) that Google already indexed now
// 301-equivalent redirect to the real city pages (/junk-removal-vancouver),
// recovering the ranking equity instead of serving a 404.
export default function CityRedirect() {
  const { cityName } = useParams();
  return <Navigate to={`/junk-removal-${(cityName || "").toLowerCase()}`} replace />;
}