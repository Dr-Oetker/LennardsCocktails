"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function OrderSuccessPage() {
  const params = useParams();

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
      <div className="bg-white border border-[#e5e3e0] rounded-lg p-6 sm:p-8 md:p-12 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#e8f3ed] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#2d5a3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] mb-4 tracking-tight">
          Bestellung aufgegeben!
        </h1>
        <p className="text-[#6b6b6b] mb-2">
          Deine Bestellung wurde erfolgreich übermittelt.
        </p>
        <p className="text-sm text-[#6b6b6b] mb-8">
          Der Gastgeber wurde benachrichtigt und bereitet deine Getränke vor.
        </p>
        <div className="space-y-3">
          <Link
            href={`/party/${params.slug}`}
            className="block w-full px-6 py-3 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors font-medium text-sm sm:text-base"
          >
            Weitere Bestellung aufgeben
          </Link>
          <p className="text-xs text-[#6b6b6b]">
            Du kannst beliebig oft bestellen
          </p>
        </div>
      </div>
    </div>
  );
}
