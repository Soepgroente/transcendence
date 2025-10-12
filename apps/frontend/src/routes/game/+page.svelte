<!-- src/routes/game/+page.svelte -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { ClientGame } from '$lib/index';
  import { type GameState, type Player } from '@repo/trpc/src/types/gameState';
  import { trpc } from '$lib/trpc';
  import { isAuthenticated, currentUser } from '$lib/auth/store';

  let canvas: HTMLCanvasElement | null = null;
  let game: ClientGame | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let subscription: { unsubscribe(): void } | null = null;
  let finalScores: Player[] | null = null;
  let showScorePopup = false;

  $: matchId = Number($page.url.searchParams.get('matchId') ?? 1);

  function handleGameFinished(data: GameState) {
    showScorePopup = true;
    finalScores = data.players;
    subscription?.unsubscribe();
    subscription = null;
  }

  function resizeCanvas() {
    if (!canvas) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    if (game != null && typeof (game as any).resize == 'function') {
      (game as any).resize(width, height, dpr);
    }
  }

  const initialState: GameState = {
    matchId: 1,
    status: 'waiting' as const,
    lastUpdate: 0,
    players: [],
    balls: [],
  };

  onMount(async () => {
    if ($isAuthenticated) {
      console.log('Welcome back!', $currentUser.id);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    if ('ResizeObserver' in window && document.documentElement) {
      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(document.documentElement);
    }

    const { startGame } = await import('$lib');
    if (game == null) {
      try {
        initialState.matchId = matchId;
        game = await startGame(
          'maps/standard2player.map',
          initialState,
          $currentUser.id
        );
      } catch (err) {
        console.warn(`Game ${matchId}) failed to start:`, err);
      }
      subscription = trpc.game.subscribeToGameState.subscribe(
        { matchId: matchId },
        {
          onData: (data) => {
            if (game) game.updateFromServer(data as GameState);
            if (data.status === 'finished') {
              handleGameFinished(data as GameState);
            }
          },
          onError: (err) => console.error('Subscription error', err),
        }
      );
      resizeCanvas();
    }
  });

  onDestroy(async () => {
    console.log('Destroying game page');
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('orientationchange', resizeCanvas);
    resizeObserver?.disconnect();
    subscription = null;

    if (game != null) {
      const { destroyGame } = await import('$lib');
      await destroyGame(game);
      game = null;
    }
  });
</script>

<canvas
  id="gameCanvas"
  bind:this={canvas}
  class="block w-screen h-screen touch-none bg-black"
></canvas>
{#if showScorePopup}
  <div
    class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 font-['Press_Start_2P']"
  >
    <div
      class="bg-gradient-to-br from-purple-700 to-indigo-900 text-white rounded-3xl p-8 shadow-2xl max-w-md w-full border-4 border-cyan-400/50"
    >
      <h2
        class="text-3xl font-bold text-cyan-400 drop-shadow-lg mb-6 text-center uppercase tracking-wide"
      >
        Game End!
      </h2>
      <div class="bg-black/30 rounded-xl p-4 mb-6 border-2 border-cyan-400/30">
        <h3
          class="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3"
        >
          Final Scores
        </h3>

        <!-- Scores List -->
        <ul class="space-y-2">
          {#each finalScores as player}
            <li
              class="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-white">{player.alias}</span>
                <span class="text-xs text-cyan-300">
                  {player.lives}
                  {player.lives === 1 ? 'life' : 'lives'}
                </span>
              </div>

              {#if player.isAlive}
                <span
                  class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase bg-green-500 text-black"
                >
                  Winner
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>

      <!-- Close Button -->
      <button
        on:click={() => {
          window.history.back();
          showScorePopup = false;
        }}
        class="mt-2 w-full px-8 py-4 bg-cyan-500 hover:bg-cyan-600 active:scale-95 shadow-lg active:shadow-inner transition-transform rounded-xl font-bold text-black text-sm uppercase"
      >
        Close
      </button>
    </div>
  </div>
{/if}
