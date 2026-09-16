import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, getErrorMessage } from "../../api";
import LcdPanel from "../../components/Shell/LcdPanel";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
import { typeColor } from "../../utils/typeColors";

const Pokedex = () => {
  const [pokemonList, setPokemonList] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const fetchPokemon = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/pokemon");
      setPokemonList(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      // A failed fetch must not masquerade as an empty dex.
      console.error("Error fetching Pokémon:", err);
      setError(getErrorMessage(err, "Could not load the Pokédex"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPokemon();
  }, [fetchPokemon]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const filteredList = pokemonList.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="device-backdrop flex items-center justify-center">
        <p
          className="font-pixel text-[0.7rem]"
          style={{ color: "var(--lcd-ink)" }}
        >
          Loading Pokedex...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="device-backdrop flex flex-col items-center justify-center gap-4 p-4">
        <p
          className="font-pixel text-[0.7rem] leading-relaxed text-center"
          role="alert"
          style={{ color: "var(--hp-red)" }}
        >
          {error}
        </p>
        <button onClick={fetchPokemon} className="pixel-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="device-backdrop p-3 sm:p-6">
      <div className="max-w-6xl mx-auto shell-bezel">
        <LcdPanel>
          {/* Title + search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1
              className="font-pixel text-lg"
              style={{
                color: "var(--lcd-ink-bright)",
                textShadow: "0 2px 0 var(--lcd-shadow)",
              }}
            >
              POKEDEX
            </h1>
            <div className="relative w-full sm:max-w-xs">
              <label htmlFor="dex-search" className="sr-only">
                Search Pokémon
              </label>
              <input
                id="dex-search"
                type="text"
                placeholder="Search Pokémon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lcd-field"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-pixel text-sm"
                  style={{ color: "var(--lcd-ink-dim)" }}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Pokémon grid (slots are tap targets into the dex entry) */}
          {filteredList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredList.slice(0, visibleCount).map((pokemon) => (
                <Link
                  key={pokemon.pokemon_id}
                  to={`/pokedex/${pokemon.pokemon_id}`}
                  className="dex-slot"
                >
                  <span
                    className="font-pixel text-[0.5rem]"
                    style={{ color: "var(--lcd-ink-dim)" }}
                  >
                    No.{pokemon.pokemon_id.toString().padStart(4, "0")}
                  </span>
                  <PokemonSprite
                    as={motion.img}
                    pokemon={pokemon}
                    variant="front"
                    layoutId={`shared-image-${pokemon.pokemon_id}`}
                    loading="lazy"
                    className="w-full pixelated"
                  />
                  <h2
                    className="font-pixel text-[0.6rem] text-center capitalize mt-1"
                    style={{ color: "var(--lcd-ink-bright)" }}
                  >
                    {pokemon.name}
                  </h2>
                  <div className="flex justify-center gap-1 mt-2 flex-wrap">
                    {pokemon.types.map((type) => (
                      <span
                        key={type}
                        className="dex-chip"
                        style={{
                          background:
                            typeColor(type),
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p
              className="font-pixel text-[0.65rem] text-center py-10 leading-relaxed"
              style={{ color: "var(--lcd-ink-dim)" }}
            >
              {searchTerm
                ? `No Pokémon match "${searchTerm}".`
                : "The Pokédex is empty."}
            </p>
          )}

          {/* Load more */}
          {visibleCount < filteredList.length && (
            <div className="flex justify-center mt-6">
              <button onClick={loadMore} className="pixel-btn">
                Load more
              </button>
            </div>
          )}
        </LcdPanel>
      </div>

      {/* Scroll to top */}
      {showScrollButton && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="pixel-btn fixed bottom-6 right-6 z-50"
          aria-label="Scroll to top"
        >
          &#9650;
        </button>
      )}
    </div>
  );
};

export default Pokedex;
