import ReactMarkdown from "react-markdown";

export default function AuditReportBody({ report }) {
  return report.split(/\n\n/).map((block, index) => {
    const lines = block.trim().split("\n");
    if (!lines[0]?.startsWith("|") || !/^\|[\s:|-]+\|$/.test(lines[1] || "")) return <ReactMarkdown key={index}>{block}</ReactMarkdown>;
    const cells = (line) => line.trim().slice(1, -1).split("|").map((cell) => cell.trim());
    return (
      <div key={index} className="my-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted"><tr>{cells(lines[0]).map((text, i) => <th key={i} className="p-3 font-bold">{text}</th>)}</tr></thead>
          <tbody>{lines.slice(2).map((line, row) => <tr key={row} className="border-t border-border align-top">{cells(line).map((text, i) => <td key={i} className="min-w-32 p-3 leading-relaxed">{text}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  });
}