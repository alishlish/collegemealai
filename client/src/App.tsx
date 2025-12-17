import { useState } from "react";

function App() {
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "600px" }}>
      <h1>College Meal Generator 🍲</h1>
      <p>Add ingredients below</p>

      {/* input box */}
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

      {/* add button */}
      <button
        onClick={() => {
          if (ingredientInput.trim() !== "") {
            setIngredients([...ingredients, ingredientInput.trim()]);
            setIngredientInput(""); // clear after adding
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

      <div style={{ marginTop: "1.5rem" }}>
        <h2>Ingredients:</h2>
        <ul>
          {ingredients.map((item, idx) => (
            <li key={idx} style={{ fontSize: "1.1rem" }}>
               {item}
            </li>
          ))}
        </ul>
      </div>

      {/* generate button (does nothing yet) */}
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
        onClick={() => {
      console.log("Generate Meal button clicked!");
    }}
      >
        Generate Meal
      </button>
    </div>
  );
}

export default App;
