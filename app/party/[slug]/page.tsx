"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Drink {
  id: string;
  name: string;
  ingredients: string[];
}

interface Party {
  id: string;
  name: string;
  drinks: { drink: Drink }[];
}

export default function PartyOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchParty();
    }
  }, [params.slug]);

  const fetchParty = async () => {
    try {
      const response = await fetch(`/api/parties/slug/${params.slug}`);
      if (response.status === 404 || response.status === 400) {
        const data = await response.json();
        setError(data.error || "Party nicht gefunden");
      } else {
        const data = await response.json();
        setParty(data);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Party:", error);
      setError("Fehler beim Laden der Party");
    } finally {
      setLoading(false);
    }
  };

  const toggleDrink = (drinkId: string) => {
    setSelectedDrinks((prev) =>
      prev.includes(drinkId)
        ? prev.filter((id) => id !== drinkId)
        : [...prev, drinkId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      alert("Bitte gib deinen Namen ein.");
      return;
    }

    if (selectedDrinks.length === 0) {
      alert("Bitte wähle mindestens ein Getränk aus.");
      return;
    }

    if (!party) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: party.id,
          guestName: guestName.trim(),
          drinkIds: selectedDrinks,
        }),
      });

      if (response.ok) {
        setOrderSuccess(true);
        // Nach 3 Sekunden zur Bestätigungsseite weiterleiten
        setTimeout(() => {
          router.push(`/party/${params.slug}/success`);
        }, 3000);
      } else {
        const data = await response.json();
        alert(data.error || "Fehler beim Absenden der Bestellung.");
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler beim Absenden der Bestellung. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Getränkekarte...</p>
        </div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🍹 Lennards Cocktails
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Party nicht gefunden"}
          </p>
          <p className="text-sm text-gray-500">
            Bitte überprüfe den Link oder kontaktiere den Gastgeber.
          </p>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Bestellung aufgegeben!
          </h1>
          <p className="text-gray-600">
            Deine Bestellung wurde erfolgreich übermittelt.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Du wirst gleich weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  const availableDrinks = party.drinks.map((pd) => pd.drink);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            🍹 Lennards Cocktails
          </h1>
          <p className="text-gray-600 text-center mb-1">{party.name}</p>
          <p className="text-sm text-gray-500 text-center">
            Wähle deine Getränke aus
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Getränkeauswahl */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Getränkekarte
            </h2>
            {availableDrinks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Keine Getränke verfügbar.
              </p>
            ) : (
              <div className="space-y-3">
                {availableDrinks.map((drink) => {
                  const isSelected = selectedDrinks.includes(drink.id);
                  return (
                    <label
                      key={drink.id}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDrink(drink.id)}
                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-semibold text-gray-900">
                          {drink.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {drink.ingredients.join(", ")}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Name eingeben */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <label
              htmlFor="guestName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Dein Name *
            </label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Gib hier deinen Namen ein"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || selectedDrinks.length === 0 || !guestName.trim()}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {submitting ? "Wird gesendet..." : "Bestellung absenden"}
          </button>

          {selectedDrinks.length > 0 && (
            <p className="text-center text-sm text-gray-600">
              {selectedDrinks.length} Getränk{selectedDrinks.length !== 1 ? "e" : ""} ausgewählt
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
