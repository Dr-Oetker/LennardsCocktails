"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PushNotificationManager from "@/components/PushNotificationManager";

interface Party {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  orders: any[];
  drinks: { drink: { id: string; name: string } }[];
}

export default function DashboardPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [availableDrinks, setAvailableDrinks] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    selectedDrinks: [] as string[],
  });
  const router = useRouter();

  useEffect(() => {
    fetchParties();
    fetchDrinks();
    
    // Live-Updates: Polling alle 5 Sekunden für Dashboard
    const interval = setInterval(() => {
      fetchParties();
    }, 5000); // Alle 5 Sekunden aktualisieren

    return () => clearInterval(interval);
  }, []);

  const fetchParties = async () => {
    try {
      const response = await fetch("/api/parties");
      const data = await response.json();
      setParties(data);
    } catch (error) {
      console.error("Fehler beim Laden der Partys:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrinks = async () => {
    try {
      const response = await fetch("/api/drinks");
      const data = await response.json();
      setAvailableDrinks(data);
    } catch (error) {
      console.error("Fehler beim Laden der Getränke:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Logout-Fehler:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Bitte gib einen Partynamen ein.");
      return;
    }

    if (formData.selectedDrinks.length === 0) {
      alert("Bitte wähle mindestens ein Getränk aus.");
      return;
    }

    try {
      const response = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          drinkIds: formData.selectedDrinks,
        }),
      });

      if (response.ok) {
        await fetchParties();
        setFormData({ name: "", selectedDrinks: [] });
        setShowForm(false);
      } else {
        const data = await response.json();
        alert(data.error || "Fehler beim Erstellen der Party.");
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler beim Erstellen der Party.");
    }
  };

  const toggleDrink = (drinkId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedDrinks: prev.selectedDrinks.includes(drinkId)
        ? prev.selectedDrinks.filter((id) => id !== drinkId)
        : [...prev.selectedDrinks, drinkId],
    }));
  };

  const togglePartyActive = async (party: Party) => {
    try {
      const response = await fetch(`/api/parties/${party.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !party.isActive }),
      });

      if (response.ok) {
        await fetchParties();
      }
    } catch (error) {
      console.error("Fehler:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#6b6b6b]">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  const activeParties = parties.filter((p) => p.isActive);
  const inactiveParties = parties.filter((p) => !p.isActive);

  return (
    <div className="min-h-screen bg-[#faf9f7] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-tight">
              Party-Verwaltung
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
              Verwalte deine Partys und Bestellungen
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link
              href="/admin/drinks"
              className="px-4 py-2 bg-white border border-[#e5e3e0] text-[#1a1a1a] rounded-lg hover:bg-[#faf9f7] transition-colors text-sm sm:text-base font-medium text-center"
            >
              Getränke verwalten
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white border border-[#e5e3e0] text-[#8b2e2e] rounded-lg hover:bg-[#faeaea] transition-colors text-sm sm:text-base font-medium"
            >
              Abmelden
            </button>
          </div>
        </div>

        <PushNotificationManager />

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
        >
          {showForm ? "Abbrechen" : "Neue Party anlegen"}
        </button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 bg-white border border-[#e5e3e0] p-5 sm:p-6 rounded-lg"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] mb-5">Neue Party</h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Partyname *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-[#e5e3e0] rounded-lg focus:ring-2 focus:ring-[#c9732f] focus:border-[#c9732f] bg-white text-[#1a1a1a] placeholder:text-[#6b6b6b] transition-colors"
                placeholder="z.B. Sommerparty 2025"
                required
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Verfügbare Getränke auswählen *
              </label>
              {availableDrinks.length === 0 ? (
                <p className="text-sm text-[#6b6b6b] mb-2">
                  Keine Getränke vorhanden.{" "}
                  <Link
                    href="/admin/drinks"
                    className="text-[#c9732f] hover:text-[#b86528] underline font-medium"
                  >
                    Erstelle zuerst Getränke
                  </Link>
                  .
                </p>
              ) : (
                <div className="border border-[#e5e3e0] rounded-lg p-4 max-h-64 overflow-y-auto bg-[#faf9f7]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {availableDrinks.map((drink) => (
                      <label
                        key={drink.id}
                        className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedDrinks.includes(drink.id)}
                          onChange={() => toggleDrink(drink.id)}
                          className="w-4 h-4 text-[#c9732f] border-[#e5e3e0] rounded focus:ring-[#c9732f]"
                        />
                        <span className="text-sm text-[#1a1a1a]">
                          {drink.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
            >
              Party erstellen
            </button>
          </form>
        )}

        <div className="space-y-6">
          {activeParties.length > 0 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] mb-4 sm:mb-5">
                Aktive Partys
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeParties.map((party) => (
                  <div
                    key={party.id}
                    className="bg-white border-2 border-[#2d5a3d] p-5 sm:p-6 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] pr-2">
                        {party.name}
                      </h3>
                      <span className="px-2 py-1 bg-[#e8f3ed] text-[#2d5a3d] text-xs font-medium rounded whitespace-nowrap">
                        Aktiv
                      </span>
                    </div>
                    <p className="text-sm text-[#4a4a4a] mb-2">
                      {party.drinks.length} Getränk{party.drinks.length !== 1 ? "e" : ""} verfügbar
                    </p>
                    <p className="text-sm text-[#4a4a4a] mb-4">
                      {party.orders.length} Bestellung{party.orders.length !== 1 ? "en" : ""}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/admin/party/${party.id}`}
                        className="flex-1 px-4 py-2 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors text-center text-sm font-medium"
                      >
                        Verwalten
                      </Link>
                      <button
                        onClick={() => togglePartyActive(party)}
                        className="px-4 py-2 bg-white border border-[#e5e3e0] text-[#1a1a1a] rounded-lg hover:bg-[#faf9f7] transition-colors text-sm font-medium"
                      >
                        Deaktivieren
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactiveParties.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] mb-4 sm:mb-5">
                Archiv
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inactiveParties.map((party) => (
                  <div
                    key={party.id}
                    className="bg-white border border-[#e5e3e0] p-5 sm:p-6 rounded-lg opacity-75"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] pr-2">
                        {party.name}
                      </h3>
                      <span className="px-2 py-1 bg-[#faf9f7] text-[#6b6b6b] text-xs font-medium rounded whitespace-nowrap">
                        Inaktiv
                      </span>
                    </div>
                    <p className="text-sm text-[#4a4a4a] mb-2">
                      {party.drinks.length} Getränk{party.drinks.length !== 1 ? "e" : ""}
                    </p>
                    <p className="text-sm text-[#4a4a4a] mb-4">
                      {party.orders.length} Bestellung{party.orders.length !== 1 ? "en" : ""}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/admin/party/${party.id}`}
                        className="flex-1 px-4 py-2 bg-white border border-[#e5e3e0] text-[#1a1a1a] rounded-lg hover:bg-[#faf9f7] transition-colors text-center text-sm font-medium"
                      >
                        Ansehen
                      </Link>
                      <button
                        onClick={() => togglePartyActive(party)}
                        className="px-4 py-2 bg-[#e8f3ed] text-[#2d5a3d] rounded-lg hover:bg-[#d4e7dc] transition-colors text-sm font-medium"
                      >
                        Aktivieren
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parties.length === 0 && (
            <div className="bg-white border border-[#e5e3e0] p-8 rounded-lg text-center">
              <p className="text-[#1a1a1a] text-base sm:text-lg mb-2 font-medium">
                Noch keine Partys vorhanden.
              </p>
              <p className="text-[#6b6b6b] text-sm">
                Klicke auf "Neue Party anlegen" um zu beginnen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
