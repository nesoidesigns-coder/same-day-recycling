const requirements = [
  ['Customer ID', 'A production Google Ads customer account the authorizing Google user can access.'],
  ['OAuth client ID and client secret', 'An OAuth client from a Google Cloud project with Google Ads API enabled.'],
  ['OAuth refresh token', 'Offline authorization for that client and user, with the https://www.googleapis.com/auth/adwords scope.'],
  ['Developer token', 'A token with production access and permissible use for keyword research; providing a token does not verify its approval.'],
];

export default function HistoricalAccessRequirements() {
  return <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
    <p>Canadian market history is independent of the age of this website or its advertising campaigns. Google documents up to four years of monthly historical search estimates, subject to access and data availability.</p>
    <ul className="list-disc space-y-2 pl-4">{requirements.map(([label, text]) => <li key={label}><strong>{label}:</strong> {text}</li>)}</ul>
    <p>Backfill remains pending until credentials are supplied and the historical retrieval path is verified. Missing provider values remain unavailable, never zero-filled. No campaign clicks or website impressions are used as national search volume.</p>
    <p><a href="https://developers.google.com/google-ads/api/docs/keyword-planning/generate-historical-metrics" target="_blank" rel="noreferrer" className="font-bold text-primary underline">Historical data documentation</a></p>
    <p>Alternative: DataForSEO requires a funded account plus its API login and API password from its API Access page. It is not connected to this app.</p>
    <a href="https://docs.dataforseo.com/v3/keywords_data-google_ads-search_volume-live/" target="_blank" rel="noreferrer" className="inline-block font-bold text-primary underline">DataForSEO historical data requirements</a>
  </div>;
}