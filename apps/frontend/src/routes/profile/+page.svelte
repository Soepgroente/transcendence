<script lang="ts">

	import { goto } from "$app/navigation";
	import { authLoaded, isAuthenticated, currentUser, authStoreMethods, initAuthStore } from "$lib/auth/store";
	import { trpc } from "$lib/trpc";
	import { onMount } from "svelte";
	import type { User } from '@repo/trpc/src/types';
	import type { MatchHistoryEntry, TournamentHistoryEntry } from "@repo/db/dbTypes";
	import { logout } from "$lib/auth/auth"
		
	let userAvatar = $state("");
	let userStat = $state({ wins: 0, losses: 0 });
	let matchHistoryTotal = $state(0);
	let userMatchHistory = $state([]);
	let userTournamentHistory = $state([]);
	let userFriends = $state([]);
	let loading = $state(true);

	async function loadUserData() {
		try {
			loading = true;

			const avatarPathRes = await trpc.user.getUserAvatar.query();

			if (avatarPathRes.status === 200) {
				userAvatar = avatarPathRes.data;
			}

			const [matchHistoryRes, tournamentHistoryRes, friendsRes] = await Promise.all([
				trpc.user.getUserMatchHistory.query(),
				trpc.user.getUserTournamentHistory.query(),
				trpc.user.getUserFriends.query()
			]);

			if (matchHistoryRes.status === 200) {
				userMatchHistory = matchHistoryRes.data;
			}
			if (tournamentHistoryRes.status === 200) {
				userTournamentHistory = tournamentHistoryRes.data;
			}
			if (friendsRes.status === 200) {
				userFriends = friendsRes.data;
			}

			matchHistoryTotal = userMatchHistory.length;
			userStat.wins = userMatchHistory.filter(m => m.isWin === true).length;
			userStat.losses = matchHistoryTotal - userStat.wins;
		} catch (error) {
			console.error('Failed to load user data: ', error);
		} finally {
			loading = false;
		}
	}
	
	$effect(() => {
		if ($authLoaded && $isAuthenticated && $currentUser?.name) {
			loadUserData();
		}
	});

	let user = $derived({
		...($currentUser || {}),
		wins: userStat.wins,
		losses: userStat.losses ,
		avatarPath: userAvatar
	})

	function formatDate(date_str: string) {

		let date = new Date(date_str);

		return date.toLocaleDateString('en-US', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function scrollToSection(sectionId: string) {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}
	}
	/**
	 * Generate a string representing the players in a match.
	 * ex: "Player1 vs Player2 vs Player3"
	 * would be used in the match history section (1vs1, or multi)
	 * @param match
	 */
	function playersString(match: MatchHistoryEntry) {
		if (match.participants && Array.isArray(match.participants) && match.participants.length > 0) {
			return match.participants.join(' vs ');
		}
		return `Match #${match.id}`;
	}

</script>

<div id="page_top" class="flex sm:p-8 md:p-12 lg:p-24 2xl:flex-row space-y-4 md:space-y-0 xl:space-x-0 2xl:space-x-16 justify-center items-center min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
	<main class="max-w-5xl min-w-3xs flex-1 py-2 sm:py-4 md:py-6 lg:py-10 px-4 font-['Press_Start_2P'] bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl shadow-2xl relative">
		{#if loading}
			<div class="flex items-center justify-center min-h-screen">
				<div class="text-center">
					<div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mb-4"></div>
					<p class="text-white font-['Press_Start_2P']">Loading profile...</p>
				</div>
			</div>
		{:else}
			<button onclick={() => logout()} class="top-4 left-4 bg-gray-700 text-white px-3 py-2 rounded">
				Logout
			</button>
			<button onclick={() => {}} class="top-4 bg-gray-700 text-white px-3 py-2 rounded">
				Edit
			</button>
			<!-- Section of info with alias and avatar on the left and wins/losses on the right of the page -->
			<header class="flex flex-col pt-2 md:flex-row justify-between items-center text-gray-300">
				<section class="flex items-center">
					<img class="w-20 h-20 rounded-full mr-4" src={user.avatarPath} alt="{user.name} avatar"/>
					<h2 class="sm:text-base md:text-xl lg:text-3xl truncate">{user.name}</h2>
				</section>
				<section class="text-center md:text-left">
					<h2 class="sm:text-base md:text-xl lg:text-3xl pb-2 text-cyan-400">Stats</h2>
					<dl class="sm:text-sm md:text-md lg:text-xl grid grid-cols-2 gap-x-4 gap-y-2">
						<dt class="text-green-400">Wins</dt>
						<dd>{user.wins}</dd>
						<dt class="text-red-400">Losses</dt>
						<dd>{user.losses}</dd>
						<dt class="text-cyan-400 whitespace-nowrap">Winrate</dt>
						<dd>{user.wins && user.losses ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0}%</dd>
					</dl>
				</section>
			</header>
			
			<!-- Lobbies and Tournaments buttons section - They redirect to the corresponding sections below -->
			<nav class="text-xs sm:text-sm md:text-md lg:text-lg my-6">
				<button onclick={() => goto('/game_lobby')} class="text-xs sm:text-sm md:text-md lg:text-lg bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded mr-1 mb-2 text-black font-bold shadow-lg">
						Match lobbies
				</button>
				<button onclick={() => goto('/tournament')} class="text-xs sm:text-sm md:text-md lg:text-lg bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded mr-1 mb-2 text-white font-bold shadow-lg">
						Tournaments
				</button>
					<button onclick={() => goto('/profile/2fa')} class="text-xs sm:text-sm md:text-md lg:text-lg bg-amber-400 hover:bg-amber-500 px-4 py-2 rounded mr-1 mb-2 text-black font-bold shadow-lg">
					Set 2FA
				</button>
			</nav>

			<!-- Match history section - scrollable -->
			<section class="mt-8">
				<div class="px-6 pt-5 border-t-3 border-cyan-400/30 flex justify-between items-center mb-4 rounded-t-2xl">
					<h3 class="sm:text-sm md:text-lg lg:text-2xl mb-4 text-cyan-400">Match history ({userMatchHistory.length})</h3>
				</div>
				<!-- <div class="max-h-128 overflow-y-auto divide-y divide-cyan-400/10"> -->
				<div class="max-h-128 overflow-y-auto space-y-2">
					{#each userMatchHistory as match}
					<article class="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
						<div class="min-w-0">
							<p class="text-gray-300 text-xs font-semibold truncate">{playersString(match)}</p>
							<time class="text-cyan-200 text-xs block mt-1">{formatDate(match.date)}</time>
						</div>
						<div class="text-right w-28 flex-shrink-0">
							<span class="{match.isWin ? 'text-green-400' : 'text-red-400'} font-semibold mr-2 block ">
								{match.isWin ? 'WIN' : 'LOSS'}
							</span>
							<small class="text-cyan-200 text-xs block mt-1 mr-2">#{match.placement}</small>
						</div>
					</article>
					{/each}
					{#if userMatchHistory.length === 0}
						<p class="text-cyan-200 text-center py-4">No matches played yet</p>
					{/if}
				</div>
			</section>

			<section class="mt-8">
				<div class="px-6 pt-5 border-t-3 border-cyan-400/30 flex justify-between items-center mb-4 rounded-t-2xl">
					<h3 class="sm:text-sm md:text-lg lg:text-2xl mb-4 text-cyan-400">Tournament history ({userTournamentHistory.length})</h3>
				</div>
				<!-- <div class="max-h-128 overflow-y-auto divide-y divide-cyan-400/10"> -->
				<div class="max-h-128 overflow-y-auto space-y-2">
					{#each userTournamentHistory as tournamentMatch}
					<article class="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
						<div class="min-w-0">
							<p class="text-gray-300 text-xs font-semibold truncate">{tournamentMatch.tournamentName}</p>
							<time class="text-cyan-200 text-xs block mt-1">{formatDate(tournamentMatch.date)}</time>
						</div>
						<div class="text-right ml-4 w-32 flex-shrink-0">
							<span class="{tournamentMatch.isWin ? 'text-green-400' : 'text-red-400'} font-semibold mr-2 block ">
								{tournamentMatch.isWin ? 'WIN' : 'LOSS'}
							</span>
							<small class="text-cyan-200 text-xs inline-block mt-1 mr-2">{tournamentMatch.playerLimit} players</small>
						</div>
					</article>
					{/each}
					{#if userTournamentHistory.length === 0}
						<p class="text-cyan-200 text-center py-4">No matches played yet</p>
					{/if}
				</div>
			</section>

			<!-- Friends list section - scrollable -->
			<section class="mt-8">
				<div class="px-6 pt-5 border-t-3 border-cyan-400/30 flex justify-between items-center mb-4 rounded-t-2xl">
					<h3 class="sm:text-sm md:text-lg lg:text-2xl mb-4 text-cyan-400">Friends ({userFriends.length})</h3>
				</div>
				<div class="max-h-128 overflow-y-auto space-y-2 divide-cyan-400/10">
					{#each userFriends as friend}
					<article class="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
							<div class="ml-2">
								<p class="text-gray-300 text-xs font-semibold truncate">{friend.alias}</p>
							</div>
						</article>
					{/each}
					{#if userFriends.length === 0}
						<p class="text-cyan-200 text-center py-4">No friends yet</p>
					{/if}
				</div>
			</section>
			<div class="text-sm md:text-md lg:text-lg mt-6 flex justify-center">
				<button onclick={() => scrollToSection('page_top')} class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 active:scale-95 rounded text-black font-bold shadow-lg">
					back to top
				</button>
			</div>
		{/if}
	</main>
</div>
