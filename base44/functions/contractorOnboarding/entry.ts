import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const DOC_FIELDS = [
  ["business_license_uri", "Business licence"],
  ["insurance_uri", "Liability insurance"],
  ["wcb_uri", "WCB / workers' compensation coverage"],
  ["vehicle_registration_uri", "Vehicle registration"],
  ["drivers_license_uri", "Driver's licence"],
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    if (body.action !== "submit") {
      return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    const company = String(body.company || "").trim();
    const ownerName = String(body.owner_name || "").trim();
    const email = String(body.email || "").trim();
    const city = String(body.city || "").trim();
    if (!company || !ownerName || !email || !city) {
      return Response.json({ error: "Company, owner name, email and city are required." }, { status: 400 });
    }

    const docs = DOC_FIELDS
      .map(([field, label]) => ({ field, label, uri: String(body[field] || "").trim() }))
      .filter((d) => d.uri);

    const application = await base44.entities.ContractorApplication.create({
      company,
      owner_name: ownerName,
      email,
      phone: String(body.phone || "").trim(),
      city,
      fleet_description: String(body.fleet_description || "").trim(),
      equipment: Array.isArray(body.equipment) ? body.equipment.slice(0, 12).map(String) : [],
      status: "new",
    });

    let verdict = "needs_attention";
    let summary = docs.length
      ? ""
      : "No verification documents were uploaded. Request them from the contractor before approving.";
    let issues = docs.length ? [] : ["No documents uploaded"];

    if (docs.length) {
      const signed = await Promise.allSettled(
        docs.map((d) => base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: d.uri, expires_in: 300 }))
      );
      const fileUrls = [];
      const labels = [];
      docs.forEach((d, i) => {
        const s = signed[i];
        if (s.status === "fulfilled" && s.value && s.value.signed_url) {
          fileUrls.push(s.value.signed_url);
          labels.push(d.label);
        } else {
          issues.push(`Could not read ${d.label} file`);
        }
      });

      if (fileUrls.length) {
        const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt:
            'You are verifying documents submitted by a junk-removal contractor applying to join Same Day Recycling\'s national Canadian partner network. ' +
            `The attached files are: ${labels.join(", ")}. The applicant company is "${company}" in ${city}. ` +
            "For each document, identify what it is and check whether it appears to be a genuine, complete, legible and currently valid document (watch for expiry dates, mismatched names, missing pages or blank fields). " +
            "Also flag any document that appears to be a placeholder, a screenshot of text, or unrelated to its label. Be conservative: anything doubtful goes to needs_attention. " +
            "Return a verdict (pass if everything checks out, needs_attention if minor issues require human review, fail if a document is clearly invalid or fraudulent), a short summary for the reviewing admin, and a list of specific issues.",
          file_urls: fileUrls,
          response_json_schema: {
            type: "object",
            properties: {
              verdict: { type: "string", enum: ["pass", "needs_attention", "fail"] },
              summary: { type: "string" },
              issues: { type: "array", items: { type: "string" } },
            },
            required: ["verdict", "summary", "issues"],
          },
        });
        if (ai && ai.verdict) {
          verdict = ai.verdict;
          summary = String(ai.summary || "").slice(0, 2000);
          issues = issues.concat(Array.isArray(ai.issues) ? ai.issues.map(String) : []);
        } else {
          summary = "AI document review could not complete. Review the documents manually.";
        }
      } else {
        summary = "Uploaded documents could not be read for AI review. Review them manually.";
      }
    }

    await base44.asServiceRole.entities.ContractorApplication.update(application.id, {
      status: "ai_reviewed",
      ai_verdict: verdict,
      ai_summary: summary,
      ai_issues: issues.slice(0, 20),
    });

    return Response.json({ id: application.id, verdict, summary, issues });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}