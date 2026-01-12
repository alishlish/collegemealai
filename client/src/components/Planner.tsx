import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

type Slot = { id: string; name: string; slot_order: number };
type Recipe = { id: string; title: string };
type PlanCell = {
  id: string;
  plan_date: string;
  meal_slot_id: string;
  recipe_id: string | null;
  variation_id: string | null;
};

function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0 sunday
  const diff = (day === 0 ? -6 : 1) - day; // monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function fmt(date: Date) {
  return date.toISOString().slice(0, 10);
}

function DraggableRecipe({ recipe }: { recipe: Recipe }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe:${recipe.id}`,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} className="draggable" {...listeners} {...attributes}>
      {recipe.title}
    </div>
  );
}

function DroppableCell({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`cell ${isOver ? "over" : ""}`}>
      {children}
    </div>
  );
}

export function Planner({ apiUrl, token }: { apiUrl: string; token: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plans, setPlans] = useState<PlanCell[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  // makes dragging feel less “clicky” and more intentional
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  function openRecipeInNewTab(recipeId: string) {
    const url = `/?recipe=${encodeURIComponent(recipeId)}&scene=book`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function load() {
    const slotsRes = await fetch(`${apiUrl}/api/planner/slots`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSlots(await slotsRes.json());

    const recipesRes = await fetch(`${apiUrl}/api/recipes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const r = await recipesRes.json();
    setRecipes(r.map((x: any) => ({ id: x.id, title: x.title })));

    const start = fmt(days[0]);
    const end = fmt(days[6]);

    const planRes = await fetch(`${apiUrl}/api/planner/week?start=${start}&end=${end}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPlans(await planRes.json());
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  function findPlan(date: string, slotId: string) {
    return plans.find((p) => p.plan_date === date && p.meal_slot_id === slotId) || null;
  }

  async function setPlanCell(plan_date: string, meal_slot_id: string, recipe_id: string | null) {
    const res = await fetch(`${apiUrl}/api/planner/set`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan_date, meal_slot_id, recipe_id }),
    });

    const updated = await res.json();
    if (!res.ok) return alert(updated?.error || "failed to set cell");

    setPlans((prev) => {
      const rest = prev.filter((p) => !(p.plan_date === plan_date && p.meal_slot_id === meal_slot_id));
      return [...rest, updated];
    });
  }

  async function clearCell(plan_date: string, meal_slot_id: string) {
    await fetch(`${apiUrl}/api/planner/unset`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan_date, meal_slot_id }),
    });

    setPlans((prev) => prev.filter((p) => !(p.plan_date === plan_date && p.meal_slot_id === meal_slot_id)));
  }

  async function onDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    if (!activeId.startsWith("recipe:")) return;
    if (!overId.startsWith("cell:")) return;

    const recipeId = activeId.split(":")[1];
    const [, date, slotId] = overId.split(":"); // cell:YYYY-MM-DD:SLOT_ID

    await setPlanCell(date, slotId, recipeId);
  }

  return (
    <div className="plannerWrap">
      <div className="plannerTop">
        <button
          className="btn btnGhost"
          onClick={() => setWeekStart(startOfWeek(new Date(weekStart.getTime() - 7 * 86400000)))}
        >
          ← prev
        </button>

        <div className="weekLabel">Week of {fmt(days[0])}</div>

        <button
          className="btn btnGhost"
          onClick={() => setWeekStart(startOfWeek(new Date(weekStart.getTime() + 7 * 86400000)))}
        >
          next →
        </button>
      </div>

      {/* ✅ DndContext MUST wrap BOTH draggable sidebar + droppable calendar */}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="plannerGrid">
          <div className="sidebar">
            <div className="miniHeading">Recipes</div>
            <div className="draggableList">
              {recipes.slice(0, 40).map((r) => (
                <DraggableRecipe key={r.id} recipe={r} />
              ))}
            </div>
            <p className="muted">drag onto calendar</p>
          </div>

          <div className="calendar">
            <div className="calHeader">
              <div className="corner" />
              {days.map((d) => (
                <div key={fmt(d)} className="dayHead">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                  <div className="muted">{fmt(d)}</div>
                </div>
              ))}
            </div>

            {slots.map((s) => (
              <div className="calRow" key={s.id}>
                <div className="slotHead">{s.name}</div>

                {days.map((d) => {
                  const date = fmt(d);
                  const p = findPlan(date, s.id);
                  const cellId = `cell:${date}:${s.id}`;

                  const recipeTitle =
                    p?.recipe_id ? recipes.find((r) => r.id === p.recipe_id)?.title || "Recipe" : null;

                  return (
                    <DroppableCell id={cellId} key={cellId}>
                      {p?.recipe_id ? (
                        <div className="cellContent">
                          <button
                            type="button"
                            className="cellTitleBtn"
                            onClick={() => openRecipeInNewTab(p.recipe_id!)}
                            title="Open recipe in new tab"
                          >
                            {recipeTitle}
                          </button>

                          <button
                            className="btn btnGhost"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              clearCell(date, s.id);
                            }}
                          >
                            clear
                          </button>
                        </div>
                      ) : (
                        <div className="cellEmpty muted">drop here</div>
                      )}
                    </DroppableCell>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DndContext>

      <button
        className="btn btnPrimary btnFull"
        onClick={async () => {
          const start = fmt(days[0]);
          const end = fmt(days[6]);
          const res = await fetch(`${apiUrl}/api/shopping/generate-week`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ start, end }),
          });
          const data = await res.json();
          if (!res.ok) return alert(data?.error || "failed");
          alert(`generated shopping list: ${data.added} items`);
        }}
      >
        generate shopping list from this week
      </button>
    </div>
  );
}
