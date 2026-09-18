// PokemonDetail.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../../api";
import { typeColor } from "../../utils/typeColors";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
import { formatStatLabel } from "../../utils/statLabels";

const MAX_STAT = 255;
const legendaryIds = [144, 145, 146, 150, 151];

function PokemonDetail() {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [primaryTypeColor, setPrimaryTypeColor] = useState("#7fe9a6");
  const [animateBars, setAnimateBars] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  // Function to fetch Pokémon data; can be re-used for retrying
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/pokemon-detail/${id}`);
      setPokemon(data);
      if (data.types && data.types.length > 0) {
        const firstType = data.types[0].toLowerCase();
        setPrimaryTypeColor(typeColor(firstType, "#7fe9a6"));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load Pokémon data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Scroll to top on mount or when id changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Trigger stat bar animation shortly after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateBars(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Trigger fade-in effect for main content and evolution chain
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="device-backdrop flex items-center justify-center">
        <p
          className="font-pixel text-[0.7rem]"
          style={{ color: "var(--lcd-ink)" }}
        >
          Loading entry...
        </p>
      </div>
    );
  }
  if (error || !pokemon) {
    return (
      <div className="device-backdrop flex flex-col items-center justify-center gap-4 p-4">
        <p
          className="font-pixel text-[0.7rem] text-center"
          role="alert"
          style={{ color: "var(--hp-red)" }}
        >
          {error || "Error loading data."}
        </p>
        <div className="flex gap-2">
          <button onClick={fetchData} className="pixel-btn pixel-btn--primary">
            Retry
          </button>
          <Link to="/pokedex" className="pixel-btn">
            Back to Pokédex
          </Link>
        </div>
      </div>
    );
  }

  // Convert stats object to an array for rendering.
  const statsArray = Object.entries(pokemon.stats).map(([key, value]) => ({
    name: key,
    base_stat: value,
  }));

  // Determine if this Pokémon is legendary
  const isLegendary = legendaryIds.includes(Number(pokemon.id));

  const labelStyle = { color: "var(--lcd-ink-dim)" };
  const valueStyle = { color: "var(--lcd-ink-bright)" };

  return (
    <div
      className="device-backdrop p-3 sm:p-6"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 0%, ${primaryTypeColor}2e, transparent 55%)`,
      }}
    >
      {/* Back to the dex grid */}
      <div className="max-w-5xl mx-auto mb-4">
        <Link to="/pokedex" className="pixel-btn">
          &#9664; Pokédex
        </Link>
      </div>

      {/* Main Content Container */}
      <div
        className={`dex-panel relative p-5 sm:p-8 max-w-5xl mx-auto transition-opacity duration-500 ease-in-out ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
        style={isLegendary ? { boxShadow: "0 0 0 3px #f8d030" } : undefined}
      >
        {/* Pokéball Watermark */}
        <div
          className="absolute right-4 top-4 opacity-10 pointer-events-none w-16 h-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #c04040 0 46%, #1a1a1a 47% 52%, #f0f0f0 53% 100%)",
          }}
          aria-hidden="true"
        />

        {/* Title */}
        <div className="text-center mb-6 pt-2">
          <h1
            className="font-pixel text-base sm:text-xl capitalize leading-relaxed"
            style={{
              color: "var(--lcd-ink-bright)",
              textShadow: "0 2px 0 var(--lcd-shadow)",
            }}
          >
            {pokemon.name} No.{String(pokemon.id).padStart(4, "0")}
          </h1>
          {isLegendary && (
            <p
              className="font-pixel text-[0.6rem] mt-3"
              style={{ color: "#f8d030" }}
            >
              A LEGENDARY POKEMON!
            </p>
          )}
        </div>

        {/* Flavor Text */}
        {pokemon.details?.flavor_text && (
          <p
            className="max-w-xl mx-auto text-center italic mb-6"
            style={{ color: "var(--lcd-ink)" }}
          >
            {pokemon.details.flavor_text}
          </p>
        )}

        {/* Profile & Image */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center mb-8">
          {/* Sprite panel */}
          <div
            className="md:w-1/2 flex justify-center items-center rounded-lg p-4"
            style={{
              background: "var(--lcd-panel)",
              border: "2px solid var(--lcd-shadow)",
            }}
          >
            <PokemonSprite
              as={motion.img}
              pokemon={pokemon}
              variant="front"
              layoutId={`shared-image-${pokemon.id}`}
              loading="lazy"
              className="w-64 h-64 object-contain pixelated"
            />
          </div>

          {/* Profile Box */}
          <div
            className="rounded-lg p-6 md:w-1/2"
            style={{
              background: "var(--lcd-raised)",
              border: "2px solid var(--lcd-shadow)",
            }}
          >
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div className="font-pixel text-[0.55rem]" style={labelStyle}>
                HEIGHT
              </div>
              <div className="font-pixel text-[0.55rem]" style={labelStyle}>
                CATEGORY
              </div>

              <div className="text-lg" style={valueStyle}>
                {pokemon.height ? pokemon.height : "—"} m
              </div>
              <div className="text-lg" style={valueStyle}>
                {pokemon.details?.category || "Pokémon"}
              </div>

              <div className="font-pixel text-[0.55rem]" style={labelStyle}>
                WEIGHT
              </div>
              <div className="font-pixel text-[0.55rem]" style={labelStyle}>
                ABILITIES
              </div>

              <div className="text-lg" style={valueStyle}>
                {pokemon.weight ? pokemon.weight : "—"} kg
              </div>
              <div className="text-lg" style={valueStyle}>
                {pokemon.abilities && pokemon.abilities.length > 0
                  ? pokemon.abilities.join(", ")
                  : "—"}
              </div>

              <div className="font-pixel text-[0.55rem]" style={labelStyle}>
                GENDER
              </div>
              <div />

              <div className="text-lg" style={valueStyle}>
                {pokemon.genders && pokemon.genders.length > 0
                  ? pokemon.genders.join(", ")
                  : "Genderless"}
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Types, Weaknesses, Stats */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Types & Weaknesses */}
          <div className="md:w-1/2 space-y-8 text-center">
            {/* Types */}
            <div>
              <h2
                className="font-pixel text-[0.7rem] mb-4"
                style={{ color: "var(--lcd-ink-bright)" }}
              >
                TYPE
              </h2>
              <div className="flex justify-center gap-3 flex-wrap">
                {pokemon.types.map((t) => (
                  <span
                    key={t}
                    className="dex-chip"
                    style={{
                      backgroundColor: typeColor(t),
                      fontSize: "0.6rem",
                      padding: "0.4rem 0.7rem",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {/* Weaknesses */}
            <div>
              <h2
                className="font-pixel text-[0.7rem] mb-4"
                style={{ color: "var(--lcd-ink-bright)" }}
              >
                WEAKNESSES
              </h2>
              <div className="flex justify-center gap-3 flex-wrap">
                {pokemon.weaknesses && pokemon.weaknesses.length > 0 ? (
                  pokemon.weaknesses.map((w) => (
                    <span
                      key={w}
                      className="dex-chip"
                      style={{
                        backgroundColor: typeColor(w),
                        fontSize: "0.6rem",
                        padding: "0.4rem 0.7rem",
                      }}
                    >
                      {w}
                    </span>
                  ))
                ) : (
                  <span
                    className="dex-chip"
                    style={{
                      backgroundColor: typeColor("normal"),
                      fontSize: "0.6rem",
                      padding: "0.4rem 0.7rem",
                    }}
                  >
                    None
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Stats */}
          <div
            className="rounded-lg p-6 w-full md:w-1/2"
            style={{
              background: "var(--lcd-panel)",
              border: "2px solid var(--lcd-shadow)",
            }}
          >
            <h2
              className="font-pixel text-[0.7rem] mb-5 text-center"
              style={{ color: "var(--lcd-ink-bright)" }}
            >
              STATS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {statsArray.map((stat) => {
                const statPercent = (stat.base_stat / MAX_STAT) * 100;
                return (
                  <div key={stat.name} className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className="capitalize font-medium"
                        style={{ color: "var(--lcd-ink)" }}
                      >
                        {formatStatLabel(stat.name)}
                      </span>
                      <span
                        className="font-pixel text-[0.6rem]"
                        style={{ color: "var(--lcd-ink-bright)" }}
                      >
                        {stat.base_stat}
                      </span>
                    </div>
                    {/* Animated horizontal bar */}
                    <div
                      className="w-full rounded-full h-2 overflow-hidden"
                      style={{ background: "var(--lcd-shadow)" }}
                    >
                      <div
                        className="h-2 rounded-full transition-all duration-500 ease-in-out"
                        style={{
                          width: animateBars ? `${statPercent}%` : "0%",
                          background: "var(--lcd-accent)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Evolution Chain */}
        <div className="mt-10">
          <h2
            className="font-pixel text-[0.7rem] text-center mb-6"
            style={{ color: "var(--lcd-ink-bright)" }}
          >
            EVOLUTIONS
          </h2>
          {(() => {
            const prevEvos = pokemon.previous_evolutions || [];
            const nextEvos = pokemon.next_evolutions || [];
            const chain = [
              ...prevEvos,
              {
                id: pokemon.id,
                name: pokemon.name,
                types: pokemon.types || [],
                requirement: pokemon.requirement,
              },
              ...nextEvos,
            ];

            const EvolutionCircle = ({ evoData }) => (
              <div className="flex flex-col items-center">
                <Link to={`/pokedex/${evoData.id}`} className="dex-slot !p-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden">
                    <PokemonSprite
                      pokemonId={evoData.id}
                      variant="front"
                      alt={evoData.name}
                      loading="lazy"
                      className="w-full h-full object-contain pixelated"
                    />
                  </div>
                </Link>
                <p
                  className="font-pixel text-[0.55rem] capitalize mt-2 text-center"
                  style={{ color: "var(--lcd-ink-bright)" }}
                >
                  {evoData.name}
                  <span
                    className="block font-pixel text-[0.45rem] mt-1"
                    style={{ color: "var(--lcd-ink-dim)" }}
                  >
                    No.{String(evoData.id).padStart(4, "0")}
                  </span>
                </p>
                {evoData.requirement && (
                  <p
                    className="font-pixel text-[0.45rem] mt-1 text-center"
                    style={{ color: "var(--lcd-accent)" }}
                  >
                    {evoData.requirement}
                  </p>
                )}
                <div className="flex space-x-1 mt-2">
                  {evoData.types?.map((type) => (
                    <span
                      key={type}
                      className="dex-chip"
                      style={{
                        backgroundColor: typeColor(type),
                        fontSize: "0.6rem",
                        padding: "0.4rem 0.7rem",
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            );

            const Arrow = () => (
              <div
                className="font-pixel text-lg hidden sm:block relative -mt-6"
                style={{ color: "var(--lcd-ink-dim)" }}
                aria-hidden="true"
              >
                &#9654;
              </div>
            );

            // Special case for Eevee
            if (chain[0].id === 133) {
              const eevee = chain[0];
              const evolutions = chain.slice(1);
              return (
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                  <EvolutionCircle evoData={eevee} />
                  {evolutions.length > 0 && <Arrow />}
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                    {evolutions.map((evo) => (
                      <EvolutionCircle evoData={evo} key={evo.id} />
                    ))}
                  </div>
                </div>
              );
            }

            // Default: arrow between each stage
            return (
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                {chain.map((poke, idx) => (
                  <React.Fragment key={poke.id}>
                    <EvolutionCircle evoData={poke} />
                    {idx < chain.length - 1 && <Arrow />}
                  </React.Fragment>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Prev / Next navigation */}
      <div className="flex justify-between max-w-5xl mx-auto mt-6">
        {pokemon.id > 1 ? (
          <Link to={`/pokedex/${pokemon.id - 1}`} className="pixel-btn">
            &#9664; Prev
          </Link>
        ) : (
          <div />
        )}
        {pokemon.id < 151 ? (
          <Link to={`/pokedex/${pokemon.id + 1}`} className="pixel-btn">
            Next &#9654;
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export default PokemonDetail;
