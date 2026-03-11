"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";

interface Party {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  drinks: { drink: { id: string; name: string; ingredients: string[] } }[];
  orders: {
    id: string;
    guestName: string;
    createdAt: string;
    isCompleted: boolean;
    completedAt: string | null;
    items: { drink: { name: string } }[];
  }[];
}

export default function PartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [availableDrinks, setAvailableDrinks] = useState<any[]>([]);
  const [showDrinkSelector, setShowDrinkSelector] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchParty();
      fetchDrinks();
    }
  }, [params.id]);

  useEffect(() => {
    if (party) {
      generateQRCode();
      setLastOrderCount(party.orders.length);
    }
  }, [party]);

  // Live-Updates: Polling alle 3 Sekunden
  useEffect(() => {
    if (!party || !isLive) return;

    const interval = setInterval(() => {
      fetchParty();
    }, 3000); // Alle 3 Sekunden aktualisieren

    return () => clearInterval(interval);
  }, [party, isLive, params.id]);

  const fetchParty = async () => {
    try {
      const response = await fetch(`/api/parties/${params.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Prüfe ob neue Bestellungen hinzugekommen sind
      if (party && data.orders && data.orders.length > lastOrderCount) {
        // Neue Bestellung - kurze visuelle Animation könnte hier hinzugefügt werden
        console.log(`Neue Bestellung! Gesamt: ${data.orders.length}`);
      }
      
      setParty(data);
      if (data.orders) {
        setLastOrderCount(data.orders.length);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Party:", error);
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

  const generateQRCode = async () => {
    if (!party) return;

    const partyUrl = `${window.location.origin}/party/${party.slug}`;
    try {
      const url = await QRCode.toDataURL(partyUrl, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error("Fehler beim Generieren des QR-Codes:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.download = `${party?.name}-qr-code.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const updatePartyDrinks = async (drinkIds: string[]) => {
    try {
      const response = await fetch(`/api/parties/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drinkIds }),
      });

      if (response.ok) {
        await fetchParty();
        setShowDrinkSelector(false);
      } else {
        alert("Fehler beim Aktualisieren der Getränke.");
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler beim Aktualisieren der Getränke.");
    }
  };

  const toggleDrink = (drinkId: string) => {
    if (!party) return;

    const currentDrinkIds = party.drinks.map((pd) => pd.drink.id);
    const isSelected = currentDrinkIds.includes(drinkId);

    const newDrinkIds = isSelected
      ? currentDrinkIds.filter((id) => id !== drinkId)
      : [...currentDrinkIds, drinkId];

    updatePartyDrinks(newDrinkIds);
  };

  const toggleOrderCompleted = async (orderId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });

      if (response.ok) {
        await fetchParty();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Fehler:", errorData);
        alert(`Fehler beim Aktualisieren der Bestellung: ${errorData.error || response.statusText}`);
      }
    } catch (error: any) {
      console.error("Fehler:", error);
      alert(`Fehler beim Aktualisieren der Bestellung: ${error.message || "Unbekannter Fehler"}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-600">Lade Party-Details...</p>
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-600">Party nicht gefunden.</p>
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const partyUrl = typeof window !== "undefined" ? `${window.location.origin}/party/${party.slug}` : "";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-blue-600 hover:underline mb-2 inline-block"
            >
              ← Zurück zum Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{party.name}</h1>
            <p className="text-gray-600 mt-1">
              Status:{" "}
              <span
                className={`font-medium ${
                  party.isActive ? "text-green-600" : "text-gray-500"
                }`}
              >
                {party.isActive ? "Aktiv" : "Inaktiv"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* QR-Code */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">QR-Code</h2>
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="border-4 border-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={downloadQRCode}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    QR-Code herunterladen
                  </button>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-1">Link:</p>
                    <p className="break-all">{partyUrl}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">QR-Code wird generiert...</p>
            )}
          </div>

          {/* Getränke-Verwaltung */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Verfügbare Getränke</h2>
              <button
                onClick={() => setShowDrinkSelector(!showDrinkSelector)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                {showDrinkSelector ? "Fertig" : "Bearbeiten"}
              </button>
            </div>

            {showDrinkSelector ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableDrinks.map((drink) => {
                  const isSelected = party.drinks.some(
                    (pd) => pd.drink.id === drink.id
                  );
                  return (
                    <label
                      key={drink.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDrink(drink.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{drink.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {party.drinks.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Noch keine Getränke ausgewählt.
                  </p>
                ) : (
                  party.drinks.map((pd) => (
                    <div
                      key={pd.drink.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="font-medium text-gray-900">
                        {pd.drink.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {pd.drink.ingredients.join(", ")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bestellübersicht */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">
                Bestellungen ({party.orders.filter((o) => !o.isCompleted).length} offen, {party.orders.filter((o) => o.isCompleted).length} erledigt)
              </h2>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Erledigte anzeigen
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  isLive
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {isLive ? (
                  <>
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Live
                  </>
                ) : (
                  "Pausiert"
                )}
              </button>
              <button
                onClick={fetchParty}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
              >
                Aktualisieren
              </button>
            </div>
          </div>
          {party.orders.length === 0 ? (
            <p className="text-gray-500">Noch keine Bestellungen.</p>
          ) : (
            <div className="space-y-3">
              {party.orders
                .filter((order) => showCompleted || !order.isCompleted)
                .map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 rounded-lg border transition ${
                      order.isCompleted
                        ? "bg-green-50 border-green-200 opacity-75"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={order.isCompleted}
                          onChange={() => toggleOrderCompleted(order.id, order.isCompleted)}
                          className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${order.isCompleted ? "text-gray-500 line-through" : "text-gray-900"}`}>
                              {order.guestName}
                            </p>
                            {order.isCompleted && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                Erledigt
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(order.createdAt).toLocaleString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {order.completedAt && (
                              <> • Erledigt: {new Date(order.completedAt).toLocaleTimeString("de-DE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}</>
                            )}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {order.items.map((item, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full text-sm ${
                                  order.isCompleted
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {item.drink.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
