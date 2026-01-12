import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

type AuthGateProps = {
  children: (session: Session) => ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="card">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page">
        <div className="card">
          <h2>Sign in</h2>

          <button
            className="btn btnPrimary btnFull"
            onClick={async () => {
              const email = prompt("email");
              const password = prompt("password");
              if (!email || !password) return;

              const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (error) alert(error.message);
            }}
          >
            Login
          </button>

          <button
            className="btn btnGhost btnFull"
            onClick={async () => {
              const email = prompt("email");
              const password = prompt("password");
              if (!email || !password) return;

              const { error } = await supabase.auth.signUp({
                email,
                password,
              });
              if (error) alert(error.message);
              else alert("Account created!");
            }}
          >
            Sign up
          </button>
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
}
