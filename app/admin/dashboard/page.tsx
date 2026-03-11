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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  const activeParties = parties.filter((p) => p.isActive);
  const inactiveParties = parties.filter((p) => !p.isActive);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🎉 Party-Verwaltung
            </h1>
            <p className="text-gray-600 mt-1">
              Verwalte deine Partys und Bestellungen
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/drinks"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Getränke verwalten
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
            >
              Abmelden
            </button>
          </div>
        </div>

        <PushNotificationManager />

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {showForm ? "✕ Abbrechen" : "+ Neue Party anlegen"}
        </button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl font-semibold mb-4">Neue Party</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partyname *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Sommerparty 2025"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verfügbare Getränke auswählen *
              </label>
              {availableDrinks.length === 0 ? (
                <p className="text-sm text-gray-500 mb-2">
                  Keine Getränke vorhanden.{" "}
                  <Link
                    href="/admin/drinks"
                    className="text-blue-600 hover:underline"
                  >
                    Erstelle zuerst Getränke
                  </Link>
                  .
                </p>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableDrinks.map((drink) => (
                      <label
                        key={drink.id}
                        className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedDrinks.includes(drink.id)}
                          onChange={() => toggleDrink(drink.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Party erstellen
            </button>
          </form>
        )}

        <div className="space-y-6">
          {activeParties.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Aktive Partys
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeParties.map((party) => (
                  <div
                    key={party.id}
                    className="bg-white p-6 rounded-lg shadow-md border-2 border-green-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {party.name}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Aktiv
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {party.drinks.length} Getränk(e) verfügbar
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {party.orders.length} Bestellung(en)
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/party/${party.id}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center text-sm font-medium"
                      >
                        Verwalten
                      </Link>
                      <button
                        onClick={() => togglePartyActive(party)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
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
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Archiv (Inaktive Partys)
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveParties.map((party) => (
                  <div
                    key={party.id}
                    className="bg-white p-6 rounded-lg shadow-md border border-gray-200 opacity-75"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {party.name}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Inaktiv
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {party.drinks.length} Getränk(e)
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {party.orders.length} Bestellung(en)
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/party/${party.id}`}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-center text-sm font-medium"
                      >
                        Ansehen
                      </Link>
                      <button
                        onClick={() => togglePartyActive(party)}
                        className="px-4 py-2 bg-green-200 text-green-800 rounded-lg hover:bg-green-300 transition text-sm"
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
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600 text-lg mb-2">
                Noch keine Partys vorhanden.
              </p>
              <p className="text-gray-500 text-sm">
                Klicke auf "Neue Party anlegen" um zu beginnen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
