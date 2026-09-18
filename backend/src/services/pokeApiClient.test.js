const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createPokeApiClient } = require("./pokeApiClient");

function fakeHttp(responses) {
  const calls = [];
  return {
    calls,
    get: async (url) => {
      calls.push(url);
      if (!(url in responses)) {
        const err = new Error(`no fake response for ${url}`);
        err.response = { status: 404 };
        throw err;
      }
      return { data: responses[url] };
    },
  };
}

describe("pokeApiClient", () => {
  it("fetches a pokemon by id from the configured base URL", async () => {
    const http = fakeHttp({
      "https://pokeapi.co/api/v2/pokemon/25": { name: "pikachu" },
    });
    const client = createPokeApiClient({ http, baseUrl: "https://pokeapi.co/api/v2" });
    const result = await client.getPokemon(25);
    assert.equal(result.name, "pikachu");
    assert.deepEqual(http.calls, ["https://pokeapi.co/api/v2/pokemon/25"]);
  });

  it("caches repeated getType calls instead of refetching", async () => {
    const http = fakeHttp({
      "https://pokeapi.co/api/v2/type/electric": { name: "electric" },
    });
    const client = createPokeApiClient({ http, baseUrl: "https://pokeapi.co/api/v2" });
    await client.getType("electric");
    await client.getType("electric");
    assert.equal(http.calls.length, 1);
  });

  it("fetches an evolution chain by its full URL, not baseUrl-joined", async () => {
    const http = fakeHttp({
      "https://pokeapi.co/api/v2/evolution-chain/10/": { id: 10 },
    });
    const client = createPokeApiClient({ http, baseUrl: "https://pokeapi.co/api/v2" });
    const result = await client.getEvolutionChain(
      "https://pokeapi.co/api/v2/evolution-chain/10/"
    );
    assert.equal(result.id, 10);
  });

  it("propagates errors from the underlying http client", async () => {
    const http = fakeHttp({});
    const client = createPokeApiClient({ http, baseUrl: "https://pokeapi.co/api/v2" });
    await assert.rejects(() => client.getPokemon(999999));
  });
});
