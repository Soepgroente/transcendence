<script lang="ts">
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc';
  import { onMount } from 'svelte';
  import type { AvailableMatch } from '@repo/db/dbTypes';

  let games: AvailableMatch[] = [];
  let loading = false;
  let error = null;
  let limit = 2;


  // TODO: this must be called every few seconds or so to keep the game list updated
  async function fetchGames() {
    try {
      loading = true;
      error = null;
      const result = await trpc.match.list.query();
      console.log(`Fetched games: ${JSON.stringify(result)}`);
      games = result;
    } catch (err) {
      console.error(`Error fetching games: ${err.message}`);
      error = `Failed to load games: ${err.message}`;
    } finally {
      loading = false;
    }
  }

  async function createGame() {
    try {
      error = null;
      const result = await trpc.match.create.mutate({
        max_players: limit,
      });
      console.log(`Game created: ${JSON.stringify(result)}`);
    } catch (err) {
      console.error(`Error creating game: ${err.message}`);
      error = `Failed to create game: ${err.message}`;
    }
    await fetchGames();
  }

  async function joinGame(gameId: number) {
    try {
      error = null;
      const result = await trpc.match.joinGame.mutate({ matchId: gameId });
      console.log(`Joined game: ${JSON.stringify(result)}`);
    } catch (err) {
      console.error(`Error joining game: ${err.message}`);
      error = `Failed to join game: ${err.message}`;
    }
    await fetchGames();
  }

  async function startGame(gameId) {
    try {
      error = null;
      console.log(`Starting game ${gameId}...`);
      await trpc.game.initializeMatch.mutate({ matchId: gameId });
      await goto(`/game?matchId=${gameId}`);
    } catch (err) {
      console.error(`Error starting game: ${err.message}`);
      error = `Failed to start game: ${err.message}`;
    }
  }

  onMount(() => {
    fetchGames();
  });
</script>

<div
  class="min-h-screen font-['Press_Start_2P'] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] py-8"
>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-8">
      <h1 class="text-5xl font-bold text-cyan-400 drop-shadow-lg mb-4">
        GAME LOBBY
      </h1>
      <p class="text-sm text-cyan-300 tracking-wide">
        Create or join a multiplayer match
      </p>
    </div>

    {#if error}
      <div
        class="bg-gradient-to-r from-red-900 to-red-700 border-2 border-red-500 rounded-2xl p-4 mb-6 shadow-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg
              class="h-6 w-6 text-red-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-xs text-red-200">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <div
      class="bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl shadow-2xl p-6 mb-8"
    >
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <select
          bind:value={limit}
          class="px-4 py-2 rounded-lg text-black text-sm font-bold"
        >
          <option value={2}>2 Players</option>
          <option value={4}>4 Players</option>
          <option value={6}>6 Players</option>
        </select>
        <button
          on:click={createGame}
          disabled={loading}
          class="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 active:scale-95 shadow-lg active:shadow-inner transition-transform rounded-xl font-bold text-black disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          CREATE GAME
        </button>

        <button
          on:click={fetchGames}
          disabled={loading}
          class="px-8 py-4 bg-purple-500 hover:bg-purple-600 active:scale-95 shadow-lg active:shadow-inner transition-transform rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'LOADING...' : 'REFRESH'}
        </button>
      </div>
    </div>

    <div
      class="bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl shadow-2xl overflow-hidden"
    >
      <div class="px-6 py-4 border-b-2 border-cyan-400/30">
        <h2 class="text-lg font-bold text-cyan-400 text-center">
          AVAILABLE GAMES
        </h2>
      </div>

      {#if loading}
        <!-- Loading State -->
        <div class="p-12 text-center">
          <div
            class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"
          ></div>
          <p class="mt-4 text-xs text-cyan-300">LOADING GAMES...</p>
        </div>
      {:else if games.length === 0}
        <!-- Empty State -->
        <div class="p-12 text-center">
          <svg
            class="mx-auto h-16 w-16 text-cyan-400/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 class="mt-4 text-sm font-bold text-cyan-300">
            NO GAMES AVAILABLE
          </h3>
          <p class="mt-2 text-xs text-cyan-400/70">
            Create a new game to start!
          </p>
        </div>
      {:else}
        <!-- Games Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-black/30">
              <tr>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider"
                >
                  GAME ID
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider"
                >
                  PLAYERS
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider"
                >
                  STATUS
                </th>
                <th
                  class="px-6 py-4 text-right text-xs font-bold text-cyan-400 uppercase tracking-wider"
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-cyan-400/20">
              {#each games as game}
                <tr class="hover:bg-black/20 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-xs font-bold text-white">
                      GAME #{game.id}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div class="text-xs text-white font-bold">
                        {game.playerCount}/{game.maxPlayers}
                      </div>
                      {#if game.playerCount === game.maxPlayers}
                        <span
                          class="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500 text-black"
                        >
                          FULL
                        </span>
                      {:else}
                        <span
                          class="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-yellow-500 text-black"
                        >
                          OPEN
                        </span>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase
                    {game.status === 'waiting'
                        ? 'bg-yellow-500 text-black'
                        : game.status === 'ready'
                          ? 'bg-green-500 text-black'
                          : game.status === 'playing'
                            ? 'bg-cyan-500 text-black'
                            : 'bg-gray-500 text-white'}"
                    >
                      {game.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex justify-end gap-2">
                      {#if game.playerCount < game.maxPlayers && game.status === 'waiting'}
                        <button
                          on:click={() => joinGame(game.id)}
                          class="inline-flex items-center px-4 py-2 border-2 border-green-400 text-[10px] font-bold rounded-xl text-green-400 bg-black/30 hover:bg-green-500 hover:text-black active:scale-95 transition-all shadow-lg"
                        >
                          JOIN
                        </button>
                      {/if}
                      {#if game.playerCount === game.maxPlayers}
                        <button
                          on:click={() => startGame(game.id)}
                          class="inline-flex items-center px-4 py-2 text-[10px] font-bold rounded-xl text-black bg-cyan-500 hover:bg-cyan-600 active:scale-95 transition-all shadow-lg"
                        >
                          START
                        </button>
                      {/if}

                      {#if game.status === 'playing'}
                        <span
                          class="inline-flex items-center px-4 py-2 text-[10px] font-bold text-cyan-400/50"
                        >
                          IN PROGRESS
                        </span>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>
