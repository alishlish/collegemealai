import { useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  checked: boolean;
};

export function Shopping({ apiUrl, token }: { apiUrl: string; token: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [manual, setManual] = useState("");

  async function load() {
    const res = await fetch(`${apiUrl}/api/shopping`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(await res.json());
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function toggle(item: Item) {
    const res = await fetch(`${apiUrl}/api/shopping/${item.id}/check`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ checked: !item.checked }),
    });
    const updated = await res.json();
    setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

    // if checking off, record purchase memory
    if (!item.checked) {
      const last = await fetch(`${apiUrl}/api/shopping/last-price?item=${encodeURIComponent(item.name)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      const store = prompt(`Store? ${last?.store ? `(last: ${last.store})` : ""}`) || last?.store || null;
      const priceStr = prompt(`Price? ${last?.price ? `(last: ${last.price})` : ""}`) || (last?.price ? String(last.price) : "");
      const price = priceStr ? Number(priceStr) : null;

      await fetch(`${apiUrl}/api/shopping/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_name: item.name, store, price }),
      });
    }
  }

  async function addManual() {
    if (!manual.trim()) return;
    alert("manual add goes in next milestone (we’ll add a POST /shopping item)");
  }

  return (
    <div>
      <h2 className="sectionTitle">Shopping List</h2>

      <div className="row">
        <input className="input" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="add item manually…" />
        <button className="btn btnPrimary" onClick={addManual}>add</button>
      </div>

      <ul className="list">
        {items.map((i) => (
          <li key={i.id} className="listRow">
            <label className="checkRow">
              <input type="checkbox" checked={i.checked} onChange={() => toggle(i)} />
              <span className={i.checked ? "checkedText" : ""}>{i.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
