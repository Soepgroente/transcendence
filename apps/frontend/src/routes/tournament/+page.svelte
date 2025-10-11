<script lang="ts">
  import { onMount } from "svelte";
  import { trpc } from "$lib/trpc";
  import {tournamentInput} from '@repo/trpc/src/schemas';
  import { goto } from "$app/navigation";
  import { currentUser } from "$lib/auth/store";
  import type { Tournament } from "@repo/db/dbTypes";

  let name: string = "";
  let limit: number = 4;
  let tournaments: Tournament[] = [];
  let loading = false;
  let error: string | null = null;
  let tournamentPlayerCount: Record<string, number> = {};

  async function fetchTournaments() {
    loading = true;
    error = null;
    try {
      tournaments = await trpc.tournament.list.query();
      for (const t of tournaments) {
        await fetchPlayerCount(t.name);
      }
    } catch (err) {
      error = "Failed to load tournaments.";
      tournaments = [];
    } finally {
      loading = false;
    }
  }

  async function fetchPlayerCount(tournamentName: string) {
    try {
      const players = await trpc.tournament.getPlayers.query({ name: tournamentName });
      tournamentPlayerCount[tournamentName] = players.length;
    } catch (err) {
      tournamentPlayerCount[tournamentName] = 0;
    }
  }

  onMount(fetchTournaments);

  async function handleCreate() {
    try {
      const validInput = tournamentInput.safeParse({
        name,
        playerLimit: limit,
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
      const res = await trpc.tournament.join.mutate({ name: tournamentName });
      await fetchTournaments();
      console.log(`Joined tournament: ${JSON.stringify(res, null, 2)}`);
      // goto tournament_brackets page with tournamentName as param
      // goto(`/tournament_brackets?tournamentName=${(tournamentName)}`);
    } catch (err) {
      error = "Failed to join tournament.";
    }
  }

  async function startTournament(tournamentName: string) {
    if (tournaments.find(t => t.name === tournamentName)?.creator !== $currentUser.id) {
      setTimeout(() => {
        goto(`/tournament_brackets?tournamentName=${(tournamentName)}`);
      }, 1000);
      return;
    }
    try {
      await trpc.tournament.start.mutate({ name: tournamentName });
      goto(`/tournament_brackets?tournamentName=${(tournamentName)}`);
    } catch (err) {
      error = err.message || "Failed to start tournament.";
      console.error('Start tournament error: ', err);
    }
  }
</script>

<div class="min-h-screen font-['Press_Start_2P'] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] py-8">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-8">
      <h1 class="text-5xl font-bold text-cyan-400 drop-shadow-lg mb-4">
        TOURNAMENTS
      </h1>
      <p class="text-sm text-cyan-300 tracking-wide">
        Create or join a tournament
      </p>
    </div>

    {#if error}
      <div class="bg-gradient-to-r from-red-900 to-red-700 border-2 border-red-500 rounded-2xl p-4 mb-6 shadow-lg">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-red-300" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-xs text-red-200">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <div class="bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl shadow-2xl p-6 mb-8">
      <div class="overflow-x-auto flex flex-col md:flex-row gap-4 justify-center">
        <input
          type="text"
          placeholder="Tournament name"
          bind:value={name}
            class="flex-1 min-w-[200px] px-4 py-2 rounded-lg text-black text-sm font-bold"
          required
        />
        <select bind:value={limit} class="flex-1px-4 py-2 rounded-lg text-black text-sm font-bold">
          <option value={2}>2 Players</option>
          <option value={4}>4 Players</option>
          <option value={8}>8 Players</option>
        </select>
        <button
          on:click={handleCreate}
          class="px-8 py-2 bg-cyan-500 hover:bg-cyan-600 active:scale-95 shadow-lg active:shadow-inner transition-transform rounded-xl font-bold text-black text-sm"
        >
          CREATE TOURNAMENT
        </button>
        <button
          on:click={fetchTournaments}
          disabled={loading}
          class="px-8 py-2 bg-purple-500 hover:bg-purple-600 active:scale-95 shadow-lg active:shadow-inner transition-transform rounded-xl font-bold text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'LOADING...' : 'REFRESH'}
        </button>
      </div>
    </div>

    <div class="bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl shadow-2xl overflow-hidden">
      <div class="px-6 py-4 border-b-2 border-cyan-400/30">
        <h2 class="text-lg font-bold text-cyan-400 text-center">
          AVAILABLE TOURNAMENTS
        </h2>
      </div>

      {#if loading}
        <div class="p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
          <p class="mt-4 text-xs text-cyan-300">LOADING TOURNAMENTS...</p>
        </div>
      {:else if tournaments.length === 0}
        <div class="p-12 text-center">
          <svg class="mx-auto h-16 w-16 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <h3 class="mt-4 text-sm font-bold text-cyan-300">NO TOURNAMENTS YET</h3>
          <p class="mt-2 text-xs text-cyan-400/70">Create a new tournament above!</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
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
      {/if}
    </div>
  </div>
</div>
