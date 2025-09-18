<script lang="ts">
  import { trpc } from '$lib/trpc';
  import type { GameState } from '@repo/trpc/src/types/gameState';

  // State variables
  let matchId = 1; // Example match ID
  let gameState: GameState | null = null;
  let subscription: any = null;
  let isSubscribed = false;
  let connectionStatus = 'Disconnected';
  let playerID: number = 1;
  let tournamentName: string;
  let messages: string[] = [];

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
            gameState = data;
            connectionStatus = 'Connected';
            isSubscribed = true;
            console.log(`Received update: ${JSON.stringify(data)}`);
          },
          onError: (error) => {
            connectionStatus = 'Error';
            console.log(`Subscription error: ${error.message}`);
          },
        },
      );
    } catch (error) {
      console.log(`Subscribe error: ${error.message}`);
    }
  }

  // Send ready action
  async function sendReady(id: number) {
    try {
      console.log('Sending ready action...');
      const result = await trpc.game.sentPlayerAction.mutate({
        matchId,
        playerId: id,
        action: 'ready',
      });
      console.log(
        `Ready action sent for player ${id}: ${JSON.stringify(result)}`,
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

  async function createTournament() {
    try {
      const result = await trpc.tournament.create.mutate({
        name: tournamentName,
        playerLimit: 4,
      });
      console.log(`Tournament created: ${JSON.stringify(result)}`);
    } catch (error) {
      alert('Error creating tournament: ' + error.message);
      console.log(`Error creating tournament: ${error.message}`);
    }
    console.log('Creating tournament with name:', tournamentName);
    tournamentName = '';
  }

  async function listTournaments() {
    try {
      const tournaments = await trpc.tournament.list.query();
      messages = [`${JSON.stringify(tournaments)}`];
    } catch (error) {
      alert('Error listing tournaments: ' + error.message);
    }
  }

  async function getPlayersInTournament(tournamentName: string) {
    messages = [];
    try {
      const tournamentPlayers = await trpc.tournament.getPlayers.query({
        name: tournamentName,
      });
      console.log(`Players in tournament: ${JSON.stringify(tournamentPlayers)}`);
      messages = [`${JSON.stringify(tournamentPlayers)}`];
    } catch (error) {
      alert('Error getting players: ' + error.message);
      console.log(`Error getting players: ${error.message}`);
    }
  }

  async function joinTournament(tournamentName: string) {
    try {
      const result = await trpc.tournament.join.mutate({
        name: tournamentName, playerId: playerID,
      });
      console.log(`Joined tournament: ${JSON.stringify(result)}`);
    } catch (error) {
      alert('Error joining tournament: ' + error.message);
      console.log(`Error joining tournament: ${error.message}`);
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
      <input
      type="number"
      bind:value={matchId}
      min="1"
      style="width: 100px;"
      />
    </label>
  </div>

  <!-- Action Buttons -->
  <div class="buttons">
    <button on:click={initGame}>🎮 Initialize Game</button>
    <button on:click={subscribeToGame} disabled={isSubscribed}
    >📡 Subscribe to Updates
    </button
    >
    <input
      type="number"
      bind:value={playerID}
      placeholder="Player ID"
      style="width: 100px;"
    />
    <button on:click={() => sendReady(playerID)}>✅ Send Ready</button>
    <p>Current Player ID: {playerID}</p>
    <button on:click={disconnect} disabled={!isSubscribed}>🔌 Disconnect
    </button
    >
  </div>

  <!-- Current Game State -->
  {#if gameState}
    <div class="game-state">
      <h2>Current Game State</h2>
      <p><strong>Status:</strong> {gameState.status}</p>
      <p><strong>Round:</strong> {gameState.currentRound}</p>
      <p><strong>Last Update:</strong> {gameState.lastUpdate}</p>

      <h3>Players:</h3>
      {#each gameState.players as player}
        <div class="player">
          <strong>{player.alias}</strong> - Ready: {player.isReady ? '✅' : '❌'}
          | Lives: {player.lives} | Position: ({player.position.x}, {player
          .position.y})
        </div>
      {/each}

      <h3>Ball:</h3>
      <p>
        Position: ({gameState.ball.position.x}, {gameState.ball.position.y})
      </p>
      <p>
        Velocity: ({gameState.ball.velocity.x}, {gameState.ball.velocity.y})
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
  </div>
  <div class="buttons">
    <button on:click={createTournament}>🏆 Create Tournament</button>
    <button on:click={listTournaments}>📋 List All Tournaments</button>
    <!--    <input type="number" bind:value={tournamentId} placeholder="tournament ID" />-->
    <button on:click={() => joinTournament(tournamentName)}>➕ Join Tournament : {tournamentName} </button>
    <button on:click={() => getPlayersInTournament(tournamentName)}>👥 Get Players in Tournament
      : {tournamentName}</button>
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
