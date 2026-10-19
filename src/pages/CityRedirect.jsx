import { useParams, Navigate } from "react-router-dom";
import { cityFromSlug } from "@/lib/cities";

export default function CityRedirect() {
  const { slug } = useParams();
  const city = cityFromSlug(slug);
  return <Navigate to={city ? `/junk-removal-${city.slug}` : "/"} replace />;
}