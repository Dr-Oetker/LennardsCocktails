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
        let errorMessage = "Fehler beim Speichern des Getränks.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
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
      <div className="min-h-screen bg-[#faf9f7] p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#6b6b6b]">Lade Getränke...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-tight">
              Getränke-Verwaltung
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
              Verwalte die globale Getränke-Datenbank
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-white border border-[#e5e3e0] text-[#1a1a1a] rounded-lg hover:bg-[#faf9f7] transition-colors text-sm sm:text-base font-medium text-center sm:text-left"
          >
            Zurück zum Dashboard
          </Link>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
        >
          {showForm ? "Abbrechen" : "Neues Getränk hinzufügen"}
        </button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 bg-white border border-[#e5e3e0] p-5 sm:p-6 rounded-lg"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] mb-5">
              {editingDrink ? "Getränk bearbeiten" : "Neues Getränk"}
            </h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-[#e5e3e0] rounded-lg focus:ring-2 focus:ring-[#c9732f] focus:border-[#c9732f] bg-white text-[#1a1a1a] placeholder:text-[#6b6b6b] transition-colors"
                placeholder="z.B. Mojito"
                required
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Zutaten * (durch Komma getrennt)
              </label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) =>
                  setFormData({ ...formData, ingredients: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-[#e5e3e0] rounded-lg focus:ring-2 focus:ring-[#c9732f] focus:border-[#c9732f] bg-white text-[#1a1a1a] placeholder:text-[#6b6b6b] transition-colors"
                placeholder="z.B. Rum, Limette, Minze, Soda"
                required
              />
              <p className="text-xs text-[#6b6b6b] mt-1">
                Trenne mehrere Zutaten mit Kommas
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Rezept (optional, nur für Admin sichtbar)
              </label>
              <textarea
                value={formData.recipe}
                onChange={(e) =>
                  setFormData({ ...formData, recipe: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2.5 border border-[#e5e3e0] rounded-lg focus:ring-2 focus:ring-[#c9732f] focus:border-[#c9732f] bg-white text-[#1a1a1a] placeholder:text-[#6b6b6b] transition-colors resize-y"
                placeholder="z.B. 50ml Rum, 25ml Limettensaft, 10 Blätter Minze..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors font-medium text-sm sm:text-base"
              >
                {editingDrink ? "Aktualisieren" : "Hinzufügen"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white border border-[#e5e3e0] text-[#1a1a1a] rounded-lg hover:bg-[#faf9f7] transition-colors text-sm sm:text-base font-medium"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="bg-white border border-[#e5e3e0] rounded-lg overflow-hidden">
          {drinks.length === 0 ? (
            <div className="p-8 text-center text-[#6b6b6b]">
              <p className="text-base sm:text-lg mb-2 font-medium">Noch keine Getränke vorhanden.</p>
              <p className="text-sm">
                Klicke auf "Neues Getränk hinzufügen" um zu beginnen.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e3e0]">
              {drinks.map((drink) => (
                <div key={drink.id} className="p-5 sm:p-6 hover:bg-[#faf9f7] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] mb-3">
                        {drink.name}
                      </h3>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-[#1a1a1a] mb-2">
                          Zutaten:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {drink.ingredients.map((ingredient, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 sm:px-3 py-1 bg-[#f5e6d9] text-[#c9732f] rounded-full text-xs sm:text-sm font-medium"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                      {drink.recipe && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-[#1a1a1a] mb-1">
                            Rezept:
                          </p>
                          <p className="text-sm text-[#6b6b6b] whitespace-pre-wrap">
                            {drink.recipe}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 sm:ml-4">
                      <button
                        onClick={() => handleEdit(drink)}
                        className="px-4 py-2 bg-[#faf5e6] text-[#8b6914] rounded-lg hover:bg-[#f5f0dc] transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(drink.id)}
                        className="px-4 py-2 bg-[#faeaea] text-[#8b2e2e] rounded-lg hover:bg-[#f5dada] transition-colors text-sm font-medium whitespace-nowrap"
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
