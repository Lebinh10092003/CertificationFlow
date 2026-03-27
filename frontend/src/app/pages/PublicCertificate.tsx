import { useEffect, useState } from "react";
import { Award, Download, FileText, GraduationCap } from "lucide-react";
import { Link, useParams } from "react-router";

import { api } from "../../lib/api";
import type { PublicCertificate as PublicCertificateType } from "../../lib/types";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export function PublicCertificate() {
  const { slug = "" } = useParams();
  const [certificate, setCertificate] = useState<PublicCertificateType | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadCertificate = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const payload = await api.fetchPublicCertificate(slug);
        setCertificate(payload);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load certificate");
      } finally {
        setLoading(false);
      }
    };

    void loadCertificate();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border bg-white p-10 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Public Certificate</p>
          <h1 className="mt-4 text-4xl font-semibold text-stone-900">Loading certificate...</h1>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-stone-100 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border bg-white p-10 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Public Certificate</p>
          <h1 className="mt-4 text-4xl font-semibold text-stone-900">Certificate not found</h1>
          <p className="mt-4 text-sm text-red-600">{errorMessage || "The provided certificate link is invalid or no longer available."}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Open admin website</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fde68a,_#f5f5f4_38%,_#ffffff_100%)] px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[2rem] border border-amber-200 bg-white/90 p-8 shadow-[0_20px_80px_rgba(120,53,15,0.12)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-700">Verified Public Certificate</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-stone-900">{certificate.student_name}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                This public page belongs to the certificate issued for {certificate.competition_name || certificate.competition?.name || "the selected competition"}.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800">
                  {certificate.award || "Award pending"}
                </div>
                <div className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800">
                  {certificate.competition_code || certificate.competition?.subject || "-"}
                </div>
                <div className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800">
                  Grade {certificate.grade || "-"}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {certificate.split_pdf_url ? (
                  <Button asChild className="w-full gap-2 sm:w-auto">
                    <a href={certificate.split_pdf_url} target="_blank" rel="noreferrer">
                      <FileText className="h-4 w-4" />
                      Open certificate PDF
                    </a>
                  </Button>
                ) : null}
                {certificate.download_pdf_url ? (
                  <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
                    <a href={certificate.download_pdf_url} rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Download certificate PDF
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            <Card className="border-stone-200 bg-stone-950 text-stone-50">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-amber-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Award</p>
                    <p className="mt-1 text-lg font-medium">{certificate.award || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-amber-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-400">School</p>
                    <p className="mt-1 text-lg font-medium">{certificate.school_name || "-"}</p>
                  </div>
                </div>
                <div className="border-t border-stone-800 pt-5 text-sm text-stone-300">
                  <div className="flex justify-between gap-4 py-2">
                    <span>Competition</span>
                    <span className="text-right text-stone-50">{certificate.competition_name || certificate.competition?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <span>Certificate Code</span>
                    <span className="text-right text-stone-50">{certificate.certificate_code || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <span>Qualified Round</span>
                    <span className="text-right text-stone-50">{certificate.qualified_round || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <span>Academic Year</span>
                    <span className="text-right text-stone-50">{certificate.competition?.academic_year || "-"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
