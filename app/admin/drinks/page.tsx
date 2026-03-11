"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Drink {
  id: string;
  name: string;
  ingredients: string[];
  recipe: string | null;
}

export default function DrinksPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ingredients: "",
    recipe: "",
  });

  useEffect(() => {
    fetchDrinks();
  }, []);

  const fetchDrinks = async () => {
    try {
      const response = await fetch("/api/drinks");
      const data = await response.json();
      setDrinks(data);
    } catch (error) {
      console.error("Fehler beim Laden der Getränke:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ingredientsArray = formData.ingredients
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    if (!formData.name || ingredientsArray.length === 0) {
      alert("Bitte fülle Name und mindestens eine Zutat aus.");
      return;
    }

    try {
      const url = editingDrink
        ? `/api/drinks/${editingDrink.id}`
        : "/api/drinks";
      const method = editingDrink ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          ingredients: ingredientsArray,
          recipe: formData.recipe || null,
        }),
      });

      if (response.ok) {
        await fetchDrinks();
        resetForm();
      } else {
        // Versuche Fehlermeldung aus Response zu extrahieren
        let errorMessage = "Fehler beim Speichern des Getränks.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Wenn Response kein JSON ist, zeige Status
          errorMessage = `Fehler ${response.status}: ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler beim Speichern des Getränks.");
    }
  };

  const handleEdit = (drink: Drink) => {
    setEditingDrink(drink);
    setFormData({
      name: drink.name,
      ingredients: drink.ingredients.join(", "),
      recipe: drink.recipe || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Möchtest du dieses Getränk wirklich löschen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/drinks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchDrinks();
      } else {
        alert("Fehler beim Löschen des Getränks.");
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler beim Löschen des Getränks.");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", ingredients: "", recipe: "" });
    setShowForm(false);
    setEditingDrink(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Lade Getränke...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🍹 Getränke-Verwaltung
            </h1>
            <p className="text-gray-600 mt-1">
              Verwalte die globale Getränke-Datenbank
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            ← Zurück zum Dashboard
          </Link>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {showForm ? "✕ Abbrechen" : "+ Neues Getränk hinzufügen"}
        </button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl font-semibold mb-4">
              {editingDrink ? "Getränk bearbeiten" : "Neues Getränk"}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Mojito"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zutaten * (durch Komma getrennt)
              </label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) =>
                  setFormData({ ...formData, ingredients: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Rum, Limette, Minze, Soda"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Trenne mehrere Zutaten mit Kommas
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rezept (optional, nur für Admin sichtbar)
              </label>
              <textarea
                value={formData.recipe}
                onChange={(e) =>
                  setFormData({ ...formData, recipe: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. 50ml Rum, 25ml Limettensaft, 10 Blätter Minze..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {editingDrink ? "Aktualisieren" : "Hinzufügen"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {drinks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Noch keine Getränke vorhanden.</p>
              <p className="text-sm mt-2">
                Klicke auf "Neues Getränk hinzufügen" um zu beginnen.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {drinks.map((drink) => (
                <div key={drink.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {drink.name}
                      </h3>
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Zutaten:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {drink.ingredients.map((ingredient, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                      {drink.recipe && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Rezept:
                          </p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {drink.recipe}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(drink)}
                        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition text-sm font-medium"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(drink.id)}
                        className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                      >
                        Löschen
                      </button>
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
