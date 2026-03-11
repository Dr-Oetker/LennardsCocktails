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
    }, 3000);

    return () => clearInterval(interval);
  }, [party, isLive, params.id]);

  const fetchParty = async () => {
    try {
      const response = await fetch(`/api/parties/${params.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (party && data.orders && data.orders.length > lastOrderCount) {
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
      <div className="min-h-screen bg-[#faf9f7] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#6b6b6b]">Lade Party-Details...</p>
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#6b6b6b] mb-4">Party nicht gefunden.</p>
          <Link href="/admin/dashboard" className="text-[#c9732f] hover:text-[#b86528] underline font-medium">
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const partyUrl = typeof window !== "undefined" ? `${window.location.origin}/party/${party.slug}` : "";

  return (
    <div className="min-h-screen bg-[#faf9f7] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/admin/dashboard"
            className="text-[#c9732f] hover:text-[#b86528] underline font-medium mb-3 inline-block text-sm sm:text-base"
          >
            Zurück zum Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-tight">{party.name}</h1>
              <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
                Status:{" "}
                <span className={`font-medium ${party.isActive ? "text-[#2d5a3d]" : "text-[#6b6b6b]"}`}>
                  {party.isActive ? "Aktiv" : "Inaktiv"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* QR-Code */}
          <div className="bg-white border border-[#e5e3e0] p-5 sm:p-6 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] mb-4">QR-Code</h2>
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="border-2 border-[#e5e3e0] rounded" />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={downloadQRCode}
                    className="w-full px-4 py-2.5 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors font-medium text-sm sm:text-base"
                  >
                    QR-Code herunterladen
                  </button>
                  <div className="text-sm text-[#4a4a4a] bg-[#faf9f7] p-3 rounded border border-[#e5e3e0]">
                    <p className="font-medium mb-1 text-[#1a1a1a]">Link:</p>
                    <p className="break-all text-xs sm:text-sm">{partyUrl}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[#6b6b6b]">QR-Code wird generiert...</p>
            )}
          </div>

          {/* Getränke-Verwaltung */}
          <div className="bg-white border border-[#e5e3e0] p-5 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-[#1a1a1a]">Verfügbare Getränke</h2>
              <button
                onClick={() => setShowDrinkSelector(!showDrinkSelector)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors text-xs sm:text-sm font-medium"
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
                      className="flex items-center space-x-2 p-2 hover:bg-[#faf9f7] rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDrink(drink.id)}
                        className="w-4 h-4 text-[#c9732f] border-[#e5e3e0] rounded focus:ring-[#c9732f]"
                      />
                      <span className="text-sm text-[#1a1a1a]">{drink.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {party.drinks.length === 0 ? (
                  <p className="text-[#6b6b6b] text-sm">
                    Noch keine Getränke ausgewählt.
                  </p>
                ) : (
                  party.drinks.map((pd) => (
                    <div
                      key={pd.drink.id}
                      className="p-3 bg-[#faf9f7] rounded-lg border border-[#e5e3e0]"
                    >
                      <p className="font-medium text-[#1a1a1a] text-sm sm:text-base">
                        {pd.drink.name}
                      </p>
                      <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
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
        <div className="bg-white border border-[#e5e3e0] p-5 sm:p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-[#1a1a1a]">
                Bestellungen ({party.orders.filter((o) => !o.isCompleted).length} offen, {party.orders.filter((o) => o.isCompleted).length} erledigt)
              </h2>
              <label className="flex items-center gap-2 text-sm text-[#6b6b6b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="w-4 h-4 text-[#c9732f] border-[#e5e3e0] rounded focus:ring-[#c9732f]"
                />
                Erledigte anzeigen
              </label>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isLive
                    ? "bg-[#e8f3ed] text-[#2d5a3d] hover:bg-[#d4e7dc]"
                    : "bg-[#faf9f7] text-[#6b6b6b] hover:bg-white border border-[#e5e3e0]"
                }`}
              >
                {isLive ? (
                  <>
                    <span className="inline-block w-2 h-2 bg-[#2d5a3d] rounded-full mr-2 animate-pulse"></span>
                    Live
                  </>
                ) : (
                  "Pausiert"
                )}
              </button>
              <button
                onClick={fetchParty}
                className="px-3 py-1.5 bg-[#f5e6d9] text-[#c9732f] rounded-lg hover:bg-[#f0dcc8] transition-colors text-xs sm:text-sm font-medium"
              >
                Aktualisieren
              </button>
            </div>
          </div>
          {party.orders.length === 0 ? (
            <p className="text-[#6b6b6b]">Noch keine Bestellungen.</p>
          ) : (
            <div className="space-y-3">
              {party.orders
                .filter((order) => showCompleted || !order.isCompleted)
                .map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      order.isCompleted
                        ? "bg-[#e8f3ed] border-[#2d5a3d]/20 opacity-75"
                        : "bg-[#faf9f7] border-[#e5e3e0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={order.isCompleted}
                          onChange={() => toggleOrderCompleted(order.id, order.isCompleted)}
                          className="mt-1 w-5 h-5 text-[#2d5a3d] border-[#e5e3e0] rounded focus:ring-[#2d5a3d] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-semibold text-sm sm:text-base ${order.isCompleted ? "text-[#6b6b6b] line-through" : "text-[#1a1a1a]"}`}>
                              {order.guestName}
                            </p>
                            {order.isCompleted && (
                              <span className="px-2 py-0.5 bg-[#2d5a3d] text-white rounded text-xs font-medium">
                                Erledigt
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
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
                                className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                                  order.isCompleted
                                    ? "bg-[#2d5a3d] text-white"
                                    : "bg-[#f5e6d9] text-[#c9732f]"
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
