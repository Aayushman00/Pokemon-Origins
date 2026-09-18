const axios = require("axios");

const DEFAULT_BASE_URL = "https://pokeapi.co/api/v2";

function createPokeApiClient({ http = axios, baseUrl = DEFAULT_BASE_URL } = {}) {
  const cache = new Map();

  async function cachedGet(url) {
    if (cache.has(url)) return cache.get(url);
    const { data } = await http.get(url);
    cache.set(url, data);
    return data;
  }

  return {
    getPokemon: (idOrName) => cachedGet(`${baseUrl}/pokemon/${idOrName}`),
    getSpecies: (idOrName) => cachedGet(`${baseUrl}/pokemon-species/${idOrName}`),
    getType: (name) => cachedGet(`${baseUrl}/type/${name}`),
    getEvolutionChain: (url) => cachedGet(url),
  };
}

module.exports = { createPokeApiClient, pokeApiClient: createPokeApiClient() };
