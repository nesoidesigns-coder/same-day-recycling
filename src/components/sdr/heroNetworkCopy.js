const COPY = {
  en: {
    title: "Canada’s living service network", intro: "Explore a municipality. Coverage is not a confirmed pickup.",
    region: "Province or territory", canada: "All Canada", city: "Explore a city", chooseCity: "Select a city",
    network3d: "3D globe", network2d: "Interactive 2D map", mapLabel: "Canadian geography and municipal service nodes", explore: "Explore",
    legend: "Network colour key", noRecords: "no observations", notConnected: "not connected", selectRegion: "select a region",
    verified: "Verified territory", demand: "Public service posts", ai: "AI findings", matching: "Contractor matching", selected: "Selected region", recruiting: "Recruitment / unverified",
    contractors: "Verified contractors", territories: "Municipal territories", posts: "Open public posts",
    provenance: "Sources, freshness and map meaning", territoriesSource: "Source: verified contractor territory records · Canada", postsSource: "Source: available public service posts · Canada",
    checking: "Checking contractor territories…", coverageError: "Coverage unavailable; no capacity assumed.", postsError: "Public-post source unavailable; no demand count assumed.",
    boundaries: "Municipal markers are not coverage radii. Connections represent shared, explicitly confirmed contractor territories, not live routes or bookings. Postal focus currently identifies the province, not an address.",
    geography: "Geography: Natural Earth, public domain", unknownTime: "Timestamp unavailable", snapshot: "Snapshot retrieved",
    close: "Close city details", details: "network details", useCity: "Start my quote here", askRex: "Ask Rex", unchecked: "Coverage not yet checked",
    noCapacity: "No contractor capacity or appointment is assumed while the source is unavailable.",
    contractorRecords: "Verified contractors covering this municipality", publicRecords: "Open public service posts recorded", publicUnavailable: "Public-post counts unavailable.",
    serviceError: "Service breakdown unavailable.", accepting: "accepting dispatch", sameDay: "record same-day capability; no slot is confirmed by these counts.",
    citySource: "Sources: explicit contractor territories and open public posts", notBookings: "Posts are not bookings or search volumes.",
  },
  fr: {
    title: "Le réseau vivant du Canada", intro: "Explorez une municipalité. La couverture ne confirme pas une collecte.",
    region: "Province ou territoire", canada: "Tout le Canada", city: "Explorer une ville", chooseCity: "Choisir une ville",
    network3d: "Globe 3D", network2d: "Carte 2D interactive", mapLabel: "Géographie du Canada et points de service municipaux", explore: "Explorer",
    legend: "Légende des couleurs", noRecords: "aucune observation", notConnected: "non connecté", selectRegion: "sélectionnez une région",
    verified: "Territoire vérifié", demand: "Publications de services", ai: "Constats de l’IA", matching: "Recherche d’un entrepreneur", selected: "Région sélectionnée", recruiting: "Recrutement / non vérifié",
    contractors: "Entrepreneurs vérifiés", territories: "Territoires municipaux", posts: "Publications ouvertes",
    provenance: "Sources, actualisation et signification", territoriesSource: "Source : territoires d’entrepreneurs vérifiés · Canada", postsSource: "Source : publications publiques de services disponibles · Canada",
    checking: "Vérification des territoires…", coverageError: "Couverture indisponible; aucune capacité présumée.", postsError: "Source publique indisponible; aucun volume de demandes présumé.",
    boundaries: "Les points municipaux ne sont pas des rayons de couverture. Les liens représentent des territoires partagés explicitement confirmés, et non des trajets ou réservations en direct. Le code postal situe actuellement la province, pas une adresse.",
    geography: "Géographie : Natural Earth, domaine public", unknownTime: "Horodatage indisponible", snapshot: "Instantané consulté",
    close: "Fermer les détails", details: "détails du réseau", useCity: "Commencer mon estimation ici", askRex: "Demander à Rex", unchecked: "Couverture non vérifiée",
    noCapacity: "Aucune capacité ni aucun rendez-vous ne sont présumés lorsque la source est indisponible.",
    contractorRecords: "Entrepreneurs vérifiés desservant cette municipalité", publicRecords: "Publications publiques de services ouvertes", publicUnavailable: "Nombre de publications indisponible.",
    serviceError: "Répartition des services indisponible.", accepting: "acceptent la répartition", sameDay: "déclarent une capacité le jour même; ces nombres ne confirment aucun créneau.",
    citySource: "Sources : territoires explicites et publications publiques ouvertes", notBookings: "Les publications ne sont ni des réservations ni des volumes de recherche.",
  },
};
const FRENCH_REGIONS = { BC: "Colombie-Britannique", AB: "Alberta", SK: "Saskatchewan", MB: "Manitoba", ON: "Ontario", QC: "Québec", NB: "Nouveau-Brunswick", NS: "Nouvelle-Écosse", PE: "Île-du-Prince-Édouard", NL: "Terre-Neuve-et-Labrador", YT: "Yukon", NT: "Territoires du Nord-Ouest", NU: "Nunavut" };
const SERVICES = {
  junk_removal: ["Junk removal", "Enlèvement d’encombrants"], furniture_removal: ["Furniture removal", "Enlèvement de meubles"], appliance_removal: ["Appliance removal", "Enlèvement d’électroménagers"], electronics: ["Electronics", "Électronique"], recycling: ["Recycling", "Recyclage"], waste_disposal: ["Waste disposal", "Élimination des déchets"], estate_cleanout: ["Estate cleanout", "Débarras de succession"], construction_debris: ["Construction debris", "Débris de construction"], demolition_cleanup: ["Demolition cleanup", "Nettoyage de démolition"], mattress_disposal: ["Mattress disposal", "Enlèvement de matelas"], yard_waste_removal: ["Yard waste", "Résidus de jardin"], commercial_waste: ["Commercial waste", "Déchets commerciaux"], hot_tub_removal: ["Hot tub removal", "Enlèvement de spa"], scrap_metal: ["Scrap metal", "Ferraille"], bin_rentals: ["Bin rentals", "Location de conteneurs"], same_day_pickup: ["Same-day pickup", "Collecte le jour même"], other: ["Other service", "Autre service"],
};
export const networkCopy = (lang) => COPY[lang] || COPY.en;
export const networkRegionName = (region, lang) => lang === "fr" ? FRENCH_REGIONS[region.code] || region.name : region.name;
export const networkServiceName = (category, lang) => (SERVICES[category] || SERVICES.other)[lang === "fr" ? 1 : 0];
export function networkTimestamp(value, lang) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return networkCopy(lang).unknownTime;
  return new Date(value).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}