<script lang="ts">
  import { trpc } from '$lib/trpc';
  import type { GameState } from '@repo/trpc/src/types/gameState';
  import { onMount } from 'svelte';
  import { tournamentInput } from '@repo/trpc/src/schemas';

  // State variables
  let matchId = 1; // Example match ID
  let gameState: GameState | null = null;
  let subscription: any = null;
  let isSubscribed = false;
  let connectionStatus = 'Disconnected';
  let playerID: number = 1;
  let maxPlayers: 2 | 4 | 6 = 2;
  let tournamentName: string;
  let messages: string[] = [];
  let error: string | null = null;
  let loading = false;
  let tournaments: any[] = [];
  let tournamentPlayerCount: Record<string, number> = {};



  // all functions need to be moved to $lib, but for testing purposes they are here
  async function initGame() {
    try {
      console.log('Initializing game...');
      const result = await trpc.game.initializeMatch.mutate({
        matchId: matchId,
      });
      console.log(`Game initialized: ${JSON.stringify(result)}`);
    } catch (error) {
      console.log(`Error initializing: ${error.message}`);
    }
  }

  // Subscribe to game updates
  function subscribeToGame() {
    try {
      console.log('Subscribing to game updates...');
      connectionStatus = 'Connecting...';

      subscription = trpc.game.subscribeToGameState.subscribe(
        { matchId },
        {
          onData: (data) => {
            gameState = data as GameState;
            connectionStatus = 'Connected';
            isSubscribed = true;
            console.log(`Received update: ${JSON.stringify(data)}`);
          },
          onError: (error) => {
            connectionStatus = 'Error';
            console.log(`Subscription error: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.log(`Subscribe error: ${error.message}`);
    }
  }

  // Send ready action
  async function sendReady() {
    try {
      console.log('Sending ready action...');
      const result = await trpc.game.sendPlayerAction.mutate({
        matchId,
        action: '-1',
      });
      console.log(
        `Ready action sent for player ${id}: ${JSON.stringify(result)}`
      );
    } catch (error) {
      console.log(`Error sending ready: ${error.message}`);
    }
  }

  function disconnect() {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
      isSubscribed = false;
      connectionStatus = 'Disconnected';
      console.log('Disconnected from game updates');
    }
  }

  //- MARK  Tournament functions
  async function fetchTournaments() {
    loading = true;
    error = null;
    try {
      tournaments = await trpc.tournament.list.query();
      for (const t of tournaments) {
        await fetchPlayerCount(t.name);
      }
    } catch (err) {
      error = 'Failed to load tournaments.';
      tournaments = [];
    } finally {
      loading = false;
    }
  }

  async function fetchPlayerCount(tournamentName: string) {
    try {
      const players = await trpc.tournament.getPlayers.query({
        name: tournamentName,
      });
      tournamentPlayerCount[tournamentName] = players.length;
    } catch (err) {
      tournamentPlayerCount[tournamentName] = 0;
    }
  }

  onMount(fetchTournaments);

  async function handleCreate() {
    try {
      const validInput = tournamentInput.safeParse({
        name: tournamentName,
        playerLimit: maxPlayers,
      });
      if (!validInput.success) {
        const messages = validInput.error.issues.map((err) => err.message);
        console.error('create tournament validation failed: ', messages);
        throw new Error(messages.join(', '));
      }
      const result = await trpc.tournament.create.mutate(validInput.data);
      console.log(`Tournament created: ${JSON.stringify(result)}`);
      await fetchTournaments();
    } catch (error) {
      alert('Error creating tournament: ' + error.message);
      console.log(`Error creating tournament: ${error.message}`);
    }
  }

  async function joinTournament(tournamentName: string) {
    try {
      await trpc.tournament.join.mutate({ name: tournamentName });
      await fetchTournaments();
    } catch (err) {
      error = 'Failed to join tournament.';
    }
  }

  async function startTournament(tournamentName: string) {
    try {
      await trpc.tournament.start.mutate({ name: tournamentName });
      await fetchTournaments();
    } catch (err) {
      error = err.message || 'Failed to start tournament.';
      console.error('Start tournament error: ', err);
    }
  }
  async function fetchBracket(tournamentName: string) {
    try {
      const bracket = await trpc.tournament.getBracket.query({ name: tournamentName });
      console.log('Tournament Bracket:', JSON.stringify(bracket, null, 2));
    } catch (err) {
      error = err.message || 'Failed to fetch tournament bracket.';
      console.error('Fetch bracket error: ', err);
    }
  }
</script>

<div class="container">
  <h1>🏓 Pong Game Testing websockets</h1>

  <!-- Connection Status -->
  <div class="status-bar">
    <span
      >Status: <strong class:connected={connectionStatus === 'Connected'}
        >{connectionStatus}</strong
      ></span
    >
    <label>
      Match ID:
      <input type="number" bind:value={matchId} min="1" style="width: 100px;" />
    </label>
  </div>

  <!-- Action Buttons -->
  <div class="buttons">
    <button on:click={initGame}>🎮 Initialize Game</button>
    <button on:click={subscribeToGame} disabled={isSubscribed}
      >📡 Subscribe to Updates
    </button>
    <input
      type="number"
      bind:value={playerID}
      placeholder="Player ID"
      style="width: 100px;"
    />
    <button on:click={() => sendReady()}>✅ Send Ready</button>
    <p>Current Player ID: {playerID}</p>
    <button on:click={disconnect} disabled={!isSubscribed}
      >🔌 Disconnect
    </button>
  </div>

  <!-- Current Game State -->
  {#if gameState}
    <div class="game-state">
      <h2>Current Game State</h2>
      <p><strong>Status:</strong> {gameState.status}</p>
      <p><strong>Last Update:</strong> {gameState.lastUpdate}</p>

      <h3>Players:</h3>
      {#each gameState.players as player}
        <div class="player">
          <strong>{player.alias}</strong> - Ready: {player.isReady
            ? '✅'
            : '❌'}
          | Lives: {player.lives} | Position: ({player.position.x}, {player
            .position.z})
        </div>
      {/each}

      <h3>Ball:</h3>
      <p>
        Position: ({gameState.balls[0].x}, {gameState.balls[0].z})
      </p>
    </div>
  {/if}
</div>

<div class="container">
  <h1>Tournament</h1>
  <p>This section is for testing tournament creation and listing.</p>
  <div class="status-bar">
    <input
      type="text"
      bind:value={tournamentName}
      placeholder="tournament Name"
    />
    <div class="status-bar">
      <select bind:value={maxPlayers}>
        <option value={2}>2</option>
        <option value={4}>4</option>
        <option value={6}>6</option>
      </select>
      <p>maxPlayers</p>
    </div>
  </div>
  <div class="buttons">
    <button on:click={() => void handleCreate()}
      >🏆 Create Tournament</button
    >
    <button on:click={fetchTournaments}>📋 List All Tournaments</button>
    <!--    <input type="number" bind:value={tournamentId} placeholder="tournament ID" />-->
    <button on:click={() => joinTournament(tournamentName)}
      >➕ Join Tournament : {tournamentName}
    </button>
    <button on:click={() => fetchPlayerCount(tournamentName)}
      >👥 Get Players in Tournament : {tournamentName}</button
    >
    <button on:click={() => startTournament(tournamentName)}
      >▶️ Start Tournament : {tournamentName}</button
    >
    <button on:click={() => fetchBracket(tournamentName)}
      >🗂️ Get Bracket : {tournamentName}</button>
  </div>
  <div class="messages">
    <div class="messages-header">
      <h3>List All Tournaments</h3>
      <button on:click={() => (messages = [])}>Clear</button>
    </div>
    <div class="message-list">
      {#if messages.length > 0}
        <div class="message">{messages}</div>
      {:else}
        <div class="message">No messages yet.</div>
      {/if}
    </div>
  </div>
   <div class="overflow-x-auto bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl shadow-2xl p-6 mt-8">
          <table class="min-w-full">
            <thead class="bg-black/30">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">NAME</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">PLAYERS</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">STATUS</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-cyan-400 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-cyan-400/20">
              {#each tournaments as t}
                <tr class="hover:bg-black/20 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-xs font-bold text-white">{t.name}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div class="text-xs text-white font-bold">
                        {tournamentPlayerCount[t.name] || 0}/{t.playerLimit}
                      </div>
                      {#if (tournamentPlayerCount[t.name] || 0) === t.playerLimit}
                        <span class="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500 text-black">FULL</span>
                      {:else}
                        <span class="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-yellow-500 text-black">OPEN</span>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase
                      {t.status === 'waiting'
                        ? 'bg-yellow-500 text-black'
                        : t.status === 'ready'
                          ? 'bg-green-500 text-black'
                          : t.status === 'ongoing'
                            ? 'bg-cyan-500 text-black'
                            : 'bg-gray-500 text-white'}">
                      {t.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex justify-end gap-2">
                      {#if t.status === 'waiting'}
                        <button
                          on:click={() => joinTournament(t.name)}
                          class="inline-flex items-center px-4 py-2 border-2 border-green-400 text-[10px] font-bold rounded-xl text-green-400 bg-black/30 hover:bg-green-500 hover:text-black active:scale-95 transition-all shadow-lg"
                        >
                          JOIN
                        </button>
                      {/if}
                      {#if t.status === 'ready'}
                        <button
                          on:click={() => startTournament(t.name)}
                          class="inline-flex items-center px-4 py-2 text-[10px] font-bold rounded-xl text-black bg-cyan-500 hover:bg-cyan-600 active:scale-95 transition-all shadow-lg"
                        >
                          START
                        </button>
                      {/if}
                      {#if t.status === 'ongoing'}
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
</div>

<style>

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
  }

  .status-bar {
    background: #f0f0f0;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 20px;
    display: flex;
    gap: 20px;
  }

  .connected {
    color: green;
  }

  .buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .buttons input {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  .buttons button {
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    background: #007bff;
    color: white;
    cursor: pointer;
  }

  .buttons button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .game-state {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
  }

  .player {
    background: white;
    padding: 8px;
    margin: 5px 0;
    border-radius: 3px;
    border-left: 3px solid #007bff;
  }

  .messages {
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .messages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: #f8f9fa;
    border-bottom: 1px solid #ddd;
  }

  .message-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
  }

  .message {
    font-family: monospace;
    font-size: 12px;
    padding: 2px 0;
    border-bottom: 1px solid #eee;
  }
</style>
