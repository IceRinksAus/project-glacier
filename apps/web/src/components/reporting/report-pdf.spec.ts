import { describe, expect, it } from "vitest";

import { createReportPdf } from "./report-pdf";

describe("createTextReportPdf", () => {
  it("creates a non-empty PDF document from report text", () => {
    const pdf = createReportPdf({
      title: "Sales Summary",
      scope: "2 selected Events",
      period: "1 January to 31 December 2027",
      generatedAt: "4 October 2026, 12:30 pm",
      metrics: [{ label: "Gross collected", value: "$55.00" }],
      columns: [{ label: "Event", width: 2 }, { label: "Gross", width: 1, align: "right" }],
      rows: [["Bathurst Winter Fest", "$55.00"]],
      note: "Operational collections evidence.",
    });

    expect(pdf.type).toBe("application/pdf");
    expect(pdf.size).toBeGreaterThan(2_000);
  });
});
