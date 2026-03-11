"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function OrderSuccessPage() {
  const params = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Bestellung aufgegeben!
        </h1>
        <p className="text-gray-600 mb-2">
          Deine Bestellung wurde erfolgreich übermittelt.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Der Gastgeber wurde benachrichtigt und bereitet deine Getränke vor.
        </p>
        <div className="space-y-3">
          <Link
            href={`/party/${params.slug}`}
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Weitere Bestellung aufgeben
          </Link>
          <p className="text-xs text-gray-500">
            Du kannst beliebig oft bestellen
          </p>
        </div>
      </div>
    </div>
  );
}
