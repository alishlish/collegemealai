import { useEffect, useState } from "react";

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  starred: boolean;
};

export function RecipeBook({ apiUrl, token }: { apiUrl: string; token: string }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "detail">("list");
  const [active, setActive] = useState<Recipe | null>(null);

  async function load(q = "") {
    const res = await fetch(`${apiUrl}/api/recipes?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRecipes(await res.json());
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function toggleStar(id: string) {
    const res = await fetch(`${apiUrl}/api/recipes/${id}/star`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = await res.json();
    setRecipes((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
    if (active?.id === updated.id) setActive(updated);
  }

  if (view === "detail" && active) {
    return (
      <div>
        <button className="btn btnGhost" onClick={() => setView("list")}>
          ← back to recipe book
        </button>

        <div className="panel">
          <div className="panelHeader">
            <strong>{active.title}</strong>
            <button className="starBtn" onClick={() => toggleStar(active.id)}>
              {active.starred ? "⭐" : "☆"}
            </button>
          </div>

          <h4>Ingredients</h4>
          <ul>
            {active.ingredients.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>

          <h4>Steps</h4>
          <ol>
            {active.steps.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>

          <div className="row">
            <button className="btn btnGhost">
              manual edit
            </button>

            <button
              className="btn btnPrimary"
              onClick={async () => {
                const delta = prompt("How do you want to change it?");
                if (!delta) return;

                const res = await fetch(`${apiUrl}/api/recipes/${active.id}/tweak`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ delta }),
                });

                const data = await res.json();
                if (!res.ok) return alert(data?.error || "failed");

                alert("Saved variation ✅");
              }}
            >
              tweak with AI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div>
      <div className="row">
        <input
          className="input"
          placeholder="search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btnPrimary" onClick={() => load(search)}>
          search
        </button>
      </div>

      <ul className="recipeList">
        {recipes.map((r) => (
          <li
            key={r.id}
            className="recipeCard"
            onClick={() => {
              setActive(r);
              setView("detail");
            }}
          >
            <strong>{r.title}</strong>
            <button
              className="starBtn"
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(r.id);
              }}
            >
              {r.starred ? "⭐" : "☆"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
