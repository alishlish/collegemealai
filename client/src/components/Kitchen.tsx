import { useEffect, useState } from "react";

type InventoryItem = {
  id: string;
  name: string;
  location: "pantry" | "fridge";
  expires_at?: string | null;
};

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  starred: boolean;
  created_at: string;
};

export function Kitchen({ apiUrl, token }: { apiUrl: string; token: string }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<"pantry" | "fridge">("pantry");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRecipe, setLastRecipe] = useState<Recipe | null>(null);

  async function load() {
    const res = await fetch(`${apiUrl}/api/inventory`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(await res.json());
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function addItem() {
    if (!name.trim()) return;

    await fetch(`${apiUrl}/api/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        location,
        expiresAt: expiresAt || null,
      }),
    });

    setName("");
    setExpiresAt("");
    await load();
  }

  async function removeItem(id: string) {
    await fetch(`${apiUrl}/api/inventory/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  }

  async function generate() {
  console.log("🔥 Generate clicked");
  setLoading(true);
  setLastRecipe(null);

  const pantry = items
    .filter((i) => i.location === "pantry")
    .map((i) => ({ name: i.name }));

  const fridge = items
    .filter((i) => i.location === "fridge")
    .map((i) => ({ name: i.name }));

  try {
    const res = await fetch(`${apiUrl}/api/recipes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ inventory: { pantry, fridge } }),
    });

    const text = await res.text();
    console.log("📡 raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server did not return JSON");
    }

    if (!res.ok) {
      throw new Error(data?.error || "Failed to generate recipe");
    }

    setLastRecipe(data);
  } catch (err: any) {
    console.error(err);
    alert(err.message || "Generation failed");
  } finally {
    setLoading(false);
  }
}


  const pantry = items.filter((i) => i.location === "pantry");
  const fridge = items.filter((i) => i.location === "fridge");

  return (
    <div>
      <h2 className="sectionTitle">Inventory</h2>

      <div className="row">
        <input className="input" value={name} placeholder="item name" onChange={(e) => setName(e.target.value)} />

        <select className="input" value={location} onChange={(e) => setLocation(e.target.value as any)}>
          <option value="pantry">pantry</option>
          <option value="fridge">fridge</option>
        </select>

        <input className="input" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />

        <button className="btn btnPrimary" onClick={addItem}>
          add
        </button>
      </div>

      <div className="twoCols">
        <div>
          <h3 className="miniHeading">Pantry</h3>
          <ul className="list">
            {pantry.map((i) => (
              <li key={i.id} className="listRow">
                <span>{i.name}</span>
                <button className="btn btnGhost" onClick={() => removeItem(i.id)}>
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="miniHeading">Fridge</h3>
          <ul className="list">
            {fridge.map((i) => (
              <li key={i.id} className="listRow">
                <span>{i.name}</span>
                <button className="btn btnGhost" onClick={() => removeItem(i.id)}>
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button className="btn btnPrimary btnFull" onClick={generate} disabled={loading || items.length === 0}>
        {loading ? "generating…" : "generate recipe (auto-saves)"}
      </button>

      {lastRecipe && (
        <div className="panel">
          <div className="panelHeader">
            <strong>{lastRecipe.title}</strong>
          </div>
          <ol>
            {lastRecipe.steps.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
