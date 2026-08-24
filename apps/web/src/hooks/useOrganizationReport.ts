"use client";

import { useEffect, useState } from "react";
import { OrganizationReport, reportingService } from "@/services/reporting.service";

export function useOrganizationReport() {
  const [report, setReport] = useState<OrganizationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    reportingService.getOrganizationSummary()
      .then(setReport)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load reporting data"))
      .finally(() => setIsLoading(false));
  }, []);

  return { report, isLoading, error };
}
