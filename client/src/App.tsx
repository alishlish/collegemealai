import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";
import { AuthGate } from "./components/AuthGate.tsx";
import { Kitchen } from "./components/Kitchen.tsx";
import { RecipeBook } from "./components/RecipeBook.tsx";
import { Planner } from "./components/Planner.tsx";
import { Shopping } from "./components/Shopping.tsx";

type Scene = "kitchen" | "book" | "planner" | "shopping";

export default function App() {
  const initialScene = (() => {
    const params = new URLSearchParams(window.location.search);
    // if you opened a recipe detail tab, go straight to Recipe Book
    if (params.get("recipe")) return "book" as Scene;

    // optional: allow direct linking to a scene
    const s = params.get("scene") as Scene | null;
    if (s === "kitchen" || s === "book" || s === "planner" || s === "shopping") return s;

    return "kitchen" as Scene;
  })();

  const [scene, setScene] = useState<Scene>(initialScene);
  const apiUrl = import.meta.env.VITE_API_URL as string;

  return (
    <AuthGate>
      {(session) => (
        <AppAuthed
          sessionToken={session.access_token}
          apiUrl={apiUrl}
          scene={scene}
          setScene={setScene}
        />
      )}
    </AuthGate>
  );
}

function AppAuthed({
  sessionToken,
  apiUrl,
  scene,
  setScene,
}: {
  sessionToken: string;
  apiUrl: string;
  scene: Scene;
  setScene: (s: Scene) => void;
}) {
  // Ensure default slots exist
  useEffect(() => {
    fetch(`${apiUrl}/api/planner/ensure-default-slots`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
    }).catch(console.error);
  }, [apiUrl, sessionToken]);

  const nav = useMemo(
    () => [
      { key: "kitchen", label: "Kitchen" },
      { key: "book", label: "Recipe Book" },
      { key: "planner", label: "Meal Plan" },
      { key: "shopping", label: "Shopping" },
    ] as const,
    []
  );

  return (
    <div className="page">
      <div className="card">
        <div className="headerRow">
          <div>
            <h1 className="title">COLLEGE MEAL</h1>
            <p className="subtitle">meal planning for college students</p>
          </div>

          <div className="headerActions">
            <button className="btn btnGhost" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        </div>

        <div className="tabs">
          {nav.map((t) => (
            <button
              key={t.key}
              className={`tab ${scene === t.key ? "active" : ""}`}
              onClick={() => setScene(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {scene === "kitchen" && <Kitchen apiUrl={apiUrl} token={sessionToken} />}
        {scene === "book" && <RecipeBook apiUrl={apiUrl} token={sessionToken} />}
        {scene === "planner" && <Planner apiUrl={apiUrl} token={sessionToken} />}
        {scene === "shopping" && <Shopping apiUrl={apiUrl} token={sessionToken} />}
      </div>
    </div>
  );
}
