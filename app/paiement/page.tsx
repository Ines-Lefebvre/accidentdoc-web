"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

function PaiementContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const appointmentId = searchParams.get("appointment_id");

  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#1e3a5f" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  // Si ce n'est pas un cas grave, afficher le paiement standard
  if (type !== "grave") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement - Lettre de réserves
          </h1>
          <p className="text-gray-600 mb-6">
            Montant : <span className="font-semibold">69€ HT</span> (82,80€ TTC)
          </p>
          <button
            className="w-full bg-blue-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-800 transition"
            onClick={() => {
              alert("Paiement standard à implémenter");
            }}
          >
            Procéder au paiement
          </button>
        </div>
      </div>
    );
  }

  // Cas grave : afficher Cal.com pour prise de RDV
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Prise de rendez-vous avocat
          </h1>
          <p className="text-gray-600 mt-2">
            Cas grave détecté - Consultation avec un avocat spécialisé requise
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-800">
                Votre dossier nécessite une attention particulière
              </h3>
              <p className="text-amber-700 text-sm mt-1">
                Suite à l'analyse de votre témoignage, nous avons détecté des
                éléments graves. Un rendez-vous avec un avocat spécialisé est recommandé.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Consultation téléphonique - 30 minutes
              </h2>
              <p className="text-gray-600 text-sm">
                Avec un avocat spécialisé en droit du travail
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">150€ HT</p>
              <p className="text-sm text-gray-500">180€ TTC</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Choisissez votre créneau
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Sélectionnez une date et un horaire qui vous conviennent.
          </p>

          <Cal
            calLink="franck-lapuyade-ydsgco/rdv-avocat-accident-grave"
            style={{ width: "100%", height: "600px", overflow: "scroll" }}
            config={{
              layout: "month_view",
              theme: "light",
            }}
          />
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Le paiement sera demandé après la sélection de votre créneau.
        </p>
      </div>
    </div>
  );
}

export default function PaiementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      }
    >
      <PaiementContent />
    </Suspense>
  );
}
