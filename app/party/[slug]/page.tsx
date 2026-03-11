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
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9732f] mx-auto mb-4"></div>
          <p className="text-[#6b6b6b]">Lade Getränkekarte...</p>
        </div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
        <div className="bg-white border border-[#e5e3e0] rounded-lg p-6 sm:p-8 max-w-md w-full text-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] mb-4">
            Lennards Cocktails
          </h1>
          <p className="text-[#6b6b6b] mb-6">
            {error || "Party nicht gefunden"}
          </p>
          <p className="text-sm text-[#6b6b6b]">
            Bitte überprüfe den Link oder kontaktiere den Gastgeber.
          </p>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
        <div className="bg-white border border-[#e5e3e0] rounded-lg p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#e8f3ed] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#2d5a3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] mb-4">
            Bestellung aufgegeben!
          </h1>
          <p className="text-[#6b6b6b]">
            Deine Bestellung wurde erfolgreich übermittelt.
          </p>
          <p className="text-sm text-[#6b6b6b] mt-4">
            Du wirst gleich weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  const availableDrinks = party.drinks.map((pd) => pd.drink);

  return (
    <div className="min-h-screen bg-[#faf9f7] py-6 sm:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-[#e5e3e0] rounded-lg p-5 sm:p-6 md:p-8 mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] mb-2 tracking-tight">
            Lennards Cocktails
          </h1>
          <p className="text-base sm:text-lg text-[#4a4a4a] mb-1 font-medium">{party.name}</p>
          <p className="text-sm text-[#6b6b6b]">
            Wähle deine Getränke aus
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Getränkeauswahl */}
          <div className="bg-white border border-[#e5e3e0] rounded-lg p-5 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] mb-4 sm:mb-5">
              Getränkekarte
            </h2>
            {availableDrinks.length === 0 ? (
              <p className="text-[#6b6b6b] text-center py-8">
                Keine Getränke verfügbar.
              </p>
            ) : (
              <div className="space-y-3">
                {availableDrinks.map((drink) => {
                  const isSelected = selectedDrinks.includes(drink.id);
                  return (
                    <label
                      key={drink.id}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-[#c9732f] bg-[#f5e6d9]"
                          : "border-[#e5e3e0] hover:border-[#c9732f]/50 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDrink(drink.id)}
                        className="mt-1 w-5 h-5 text-[#c9732f] border-[#e5e3e0] rounded focus:ring-[#c9732f]"
                      />
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="font-semibold text-[#1a1a1a] text-sm sm:text-base">
                          {drink.name}
                        </p>
                        <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
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
          <div className="bg-white border border-[#e5e3e0] rounded-lg p-5 sm:p-6 md:p-8">
            <label
              htmlFor="guestName"
              className="block text-sm font-medium text-[#1a1a1a] mb-2"
            >
              Dein Name *
            </label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-3 border border-[#e5e3e0] rounded-lg focus:ring-2 focus:ring-[#c9732f] focus:border-[#c9732f] bg-white text-[#1a1a1a] placeholder:text-[#6b6b6b] transition-colors"
              placeholder="Gib hier deinen Namen ein"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || selectedDrinks.length === 0 || !guestName.trim()}
            className="w-full px-6 py-4 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Wird gesendet..." : "Bestellung absenden"}
          </button>

          {selectedDrinks.length > 0 && (
            <p className="text-center text-sm text-[#6b6b6b]">
              {selectedDrinks.length} Getränk{selectedDrinks.length !== 1 ? "e" : ""} ausgewählt
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
