import { useState } from "react";

type Recipe = {
  title: string;
  ingredients: string[];
  steps: string[];
};

function getCollegeReality(recipe: Recipe) {
  const stepsCount = recipe.steps.length;

  const tags = [];

  if (stepsCount <= 5) tags.push("Quick to make");
  if (stepsCount <= 7) tags.push("Low effort");
  if (!recipe.ingredients.some(i => i.toLowerCase().includes("oven")))
    tags.push("No oven needed");

  tags.push("Minimal cleanup");
  tags.push("College-friendly");

  return tags;
}

function App() {
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        maxWidth: "600px",
      }}
    >
      <h1>College Meal Generator</h1>
      <p>Add ingredients below</p>

      {/* Input + Add button */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          placeholder="e.g. rice"
          style={{
            padding: "8px",
            width: "70%",
            marginRight: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />

        <button
          onClick={() => {
            if (ingredientInput.trim() !== "") {
              setIngredients([...ingredients, ingredientInput.trim()]);
              setIngredientInput("");
            }
          }}
          style={{
            padding: "8px 12px",
            backgroundColor: "#0066ff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>

      {/* Ingredient list */}
      <div>
        <h2>Ingredients:</h2>
        <ul>
          {ingredients.map((item, idx) => (
            <li key={idx}> {item}</li>
          ))}
        </ul>
      </div>

      {/* Generate button */}
      <button
        style={{
          marginTop: "1.5rem",
          padding: "10px 16px",
          backgroundColor: "black",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={async () => {
          if (ingredients.length === 0) {
            alert("Add at least one ingredient");
            return;
          }

          try {
            setLoading(true);

            const res = await fetch("http://localhost:5001/api/generate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ingredients }),
            });

            const data: Recipe = await res.json();
            setRecipe(data);
          } catch (err) {
            console.error("Error generating meal", err);
          } finally {
            setLoading(false);
          }
        }}
      >
        Generate Meal
      </button>

      {/* Loading + Result */}
      {loading && <p style={{ marginTop: "1rem" }}>Generating meal...</p>}

      {recipe && (
        <div style={{ marginTop: "2rem" }}>
          <h2>{recipe.title}</h2>

          <h3>Ingredients</h3>
          <ul>
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx}>{ing}</li>
            ))}
          </ul>

          <h3>Steps</h3>
          <ol>
            {recipe.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {recipe && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>College Reality Check</h3>
          <ul>
            {getCollegeReality(recipe).map((tag, idx) => (
              <li key={idx}>✔️ {tag}</li>
            ))}
          </ul>
        </div>
    )}
  </div>
);
}

export default App;
