import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Recipe = {
  title: string;
  ingredients: string[];
  steps: string[];
};

function getCollegeReality(recipe: Recipe) {
  const stepsCount = recipe.steps.length;
  const tags: string[] = [];

  if (stepsCount <= 5) tags.push("Quick to make");
  if (stepsCount <= 7) tags.push("Low effort");
  if (!recipe.ingredients.some((i) => i.toLowerCase().includes("oven"))) {
    tags.push("No oven needed");
  }

  tags.push("Minimal cleanup");
  tags.push("College-friendly");

  return tags;
}

function LoadingDots() {
  return (
    <span className="simmer">
      Generating something cozy
      <span className="dots" aria-hidden="true">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
    </span>
  );
}

function App() {
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  // Cozy night mode toggle
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const realityTags = useMemo(() => (recipe ? getCollegeReality(recipe) : []), [recipe]);

  const handleAddIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (!trimmed) return;
    setIngredients((prev) => [...prev, trimmed]);
    setIngredientInput("");
  };

  const handleGenerateMeal = async () => {
    if (ingredients.length === 0) {
      alert("Add at least one ingredient");
      return;
    }

    try {
      setLoading(true);
      setRecipe(null);

      const res = await fetch("http://localhost:5001/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      const data: Recipe = await res.json();
      setRecipe(data);
    } catch (err) {
      console.error("Error generating meal", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="headerRow">
          <div>
            <h1 className="title">College Meal Generator 🍲</h1>
            <p className="subtitle">Warm, easy meals that actually fit student life.</p>
          </div>

          <button
            className="toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label="Toggle dark mode"
            title="Toggle cozy night mode"
          >
            {theme === "dark" ? "🌙 Night" : "☀️ Day"}
          </button>
        </div>

        <div className="row">
          <input
            className="input"
            type="text"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            placeholder="e.g. rice"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddIngredient();
            }}
          />

          <button className="btn btnPrimary" onClick={handleAddIngredient}>
            Add
          </button>
        </div>

        {ingredients.length > 0 && (
          <>
            <h3 className="sectionTitle">Ingredients</h3>
            <ul className="chips">
              {ingredients.map((item, idx) => (
                <li key={idx} className="chip">
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        <button className="btn btnPrimary btnFull" onClick={handleGenerateMeal}>
          Generate Meal
        </button>

        {loading && (
          <p className="muted">
            <LoadingDots />
          </p>
        )}

        {recipe && (
          <div className="result">
            <h2 className="resultTitle">{recipe.title}</h2>

            <h4>Ingredients</h4>
            <ul>
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>{ing}</li>
              ))}
            </ul>

            <h4>Steps</h4>
            <ol>
              {recipe.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>

            <div className="infoBox">
              <strong>College Reality Check</strong>
              <ul style={{ marginTop: "0.5rem" }}>
                {realityTags.map((tag, idx) => (
                  <li key={idx}>✔️ {tag}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
