import { useEffect, useState } from "react";

type ShoppingItem = {
  id: string;
  item_name: string;
  quantity: string | null;
  checked: boolean;
  store: string | null;
  price: number | null;
  created_at: string;
};

export function Shopping({ apiUrl, token }: { apiUrl: string; token: string }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function safeJson(res: Response) {
    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(text), raw: text };
    } catch {
      return { ok: res.ok, status: res.status, data: null, raw: text };
    }
  }

  async function load() {
    setErrorMsg(null);

    console.log("🛒 load shopping:", { apiUrl, hasToken: !!token });
    const res = await fetch(`${apiUrl}/api/shopping`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const parsed = await safeJson(res);
    console.log("🛒 load response:", parsed);

    if (!parsed.ok) {
      setErrorMsg(parsed.data?.error || `Failed to load (${parsed.status})`);
      return;
    }

    setItems(Array.isArray(parsed.data) ? parsed.data : []);
  }

  useEffect(() => {
    load().catch((e) => {
      console.error(e);
      setErrorMsg(e?.message || "Load failed");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addItem() {
    console.log("➕ addItem clicked");
    setErrorMsg(null);

    const item_name = name.trim();
    if (!item_name) {
      setErrorMsg("Enter an item name.");
      return;
    }
    if (!apiUrl) {
      setErrorMsg("VITE_API_URL is missing (apiUrl undefined).");
      return;
    }
    if (!token) {
      setErrorMsg("Missing auth token.");
      return;
    }

    setBusy(true);
    try {
      console.log("➕ POST", `${apiUrl}/api/shopping`, { item_name, quantity: qty.trim() || null });

      const res = await fetch(`${apiUrl}/api/shopping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ item_name, quantity: qty.trim() || null }),
      });

      const parsed = await safeJson(res);
      console.log("➕ add response:", parsed);

      if (!parsed.ok) {
        setErrorMsg(parsed.data?.error || `Add failed (${parsed.status})`);
        return;
      }

      setName("");
      setQty("");

      // add to top
      setItems((prev) => [parsed.data as ShoppingItem, ...prev]);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id: string) {
    setErrorMsg(null);
    const res = await fetch(`${apiUrl}/api/shopping/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const parsed = await safeJson(res);
    if (!parsed.ok) {
      setErrorMsg(parsed.data?.error || `Delete failed (${parsed.status})`);
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function toggleChecked(item: ShoppingItem) {
    setErrorMsg(null);

    const res = await fetch(`${apiUrl}/api/shopping/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ checked: !item.checked }),
    });

    const parsed = await safeJson(res);
    if (!parsed.ok) {
      setErrorMsg(parsed.data?.error || `Update failed (${parsed.status})`);
      return;
    }

    setItems((prev) => prev.map((x) => (x.id === item.id ? (parsed.data as ShoppingItem) : x)));
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div>
      <h2 className="sectionTitle">Shopping</h2>

      {errorMsg && (
        <div className="panel" style={{ border: "1px solid #ff4d4f", marginBottom: 12 }}>
          <strong style={{ color: "#ff4d4f" }}>Error:</strong> {errorMsg}
        </div>
      )}

      <div className="row">
        <input
          className="input"
          placeholder="item (e.g. milk)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="qty (optional)"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <button className="btn btnPrimary" onClick={addItem} disabled={busy}>
          {busy ? "adding…" : "add"}
        </button>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panelHeader" style={{ justifyContent: "space-between" }}>
          <strong>To buy</strong>
          <span className="muted">{unchecked.length} items</span>
        </div>

        <ul className="list">
          {unchecked.map((i) => (
            <li key={i.id} className="listRow">
              <div>
                <div style={{ fontWeight: 600 }}>{i.item_name}</div>
                {i.quantity ? <div className="muted">{i.quantity}</div> : null}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn btnGhost" onClick={() => removeItem(i.id)}>
                  remove
                </button>
                <button className="btn btnPrimary" onClick={() => toggleChecked(i)}>
                  got it
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panelHeader" style={{ justifyContent: "space-between" }}>
          <strong>Purchased</strong>
          <span className="muted">{checked.length} items</span>
        </div>

        <ul className="list">
          {checked.map((i) => (
            <li key={i.id} className="listRow" style={{ opacity: 0.75 }}>
              <div>
                <div style={{ fontWeight: 600 }}>✅ {i.item_name}</div>
                {i.quantity ? <div className="muted">{i.quantity}</div> : null}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn btnGhost" onClick={() => toggleChecked(i)}>
                  undo
                </button>
                <button className="btn btnGhost" onClick={() => removeItem(i.id)}>
                  remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btnGhost btnFull" onClick={() => load()} disabled={busy}>
        refresh
      </button>
    </div>
  );
}
