// App.jsx
import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import "./index.css";

// Components
import Pokedex from "./pages/Pokedex/pokedex";
import PokemonDetail from "./pages/Pokedex/pokemonDetail";
import Game from "./pages/Game/Game";
import AuthPage from "./pages/AuthPage/AuthPage";
import Header from "./components/Header/header";
import Level from './pages/Game/Level';
import Bag from './pages/Game/Bag';
import Mart from './pages/Game/Mart';
import Landing from "./pages/Landing/Landing";
import Playground from "./pages/Playground/Playground";

import { api } from "./api";

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

function AnimatedRoutes({ user }) {
  const location = useLocation();
  return (
    <TransitionGroup>
      <CSSTransition key={location.key} timeout={200} classNames="fade">
        <Routes location={location}>
          {/* Landing is the public front door; unknown routes still redirect by session */}
          <Route path="/" element={<Landing />} />
          <Route path="/pokedex" element={<Pokedex />} />
          <Route path="/pokedex/:id" element={<PokemonDetail />} />
          <Route path="/auth" element={<AuthPage />} />
          {/* Phase 10: any campaign level; /level/1 keeps working */}
          <Route
            path="/level/:levelNumber"
            element={user ? <Level /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/game"
            element={user ? <Game /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/game/bag"
            element={user ? <Bag /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/game/mart"
            element={user ? <Mart /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/playground"
            element={user ? <Playground /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={user ? "/game" : "/auth"} replace />}
          />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [rehydrated, setRehydrated] = useState(false);

  useEffect(() => {
    async function validateSession() {
      const storedUser = localStorage.getItem("trainer");
      const token = localStorage.getItem("token");
      if (storedUser && token) {
        try {
          const { data } = await api.get("/api/validate");
          if (data.success) {
            setUser(data.user);
            localStorage.setItem("trainer", JSON.stringify(data.user));
          } else {
            localStorage.removeItem("trainer");
            localStorage.removeItem("token");
            setUser(null);
          }
        } catch (error) {
          console.error("Validation error:", error);
          localStorage.removeItem("trainer");
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setRehydrated(true);
    }
    validateSession();
  }, []);

  if (!rehydrated)
    return (
      <div className="device-backdrop flex items-center justify-center">
        <p
          className="font-pixel text-[0.7rem]"
          style={{ color: "var(--lcd-ink)" }}
        >
          Booting...
        </p>
      </div>
    );

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <div
          className="min-h-screen"
          style={{ background: "var(--charcoal)", color: "var(--lcd-ink)" }}
        >
          <Header />
          <AnimatedRoutes user={user} />
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
