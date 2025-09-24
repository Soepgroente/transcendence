<!-- src/routes/game/+page.svelte -->
<!-- <script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Game } from '$lib/index';

	let game: Game = null;
	onMount(async () =>
	{
		const { startGame } = await import('$lib');
		if (game == null)
		{
			game = await startGame('maps/standard4player.map');
		}
	});
	onDestroy(async () =>
	{
		const { destroyGame } = await import('$lib');
		if (game != null)
		{
			await destroyGame(game);
			game = null;
		}
	});
</script>

<canvas id="gameCanvas" class="size-full"></canvas>
<input id="mapInput" type="file" accept=".map" /> -->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ClientGame } from '$lib/index';

	let canvas: HTMLCanvasElement | null = null;
	let game: ClientGame | null = null;
	let resizeObserver: ResizeObserver | null = null;

	function resizeCanvas()
	{
		if (!canvas)
		{
			return;
		}

		const dpr = window.devicePixelRatio || 1;
		const width = window.innerWidth;
		const height = window.innerHeight;

		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;

		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);

		if (game != null && typeof (game as any).resize == 'function')
		{
			(game as any).resize(width, height, dpr);
		}
	}

	onMount(async () =>
	{
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		window.addEventListener('orientationchange', resizeCanvas);

		if ('ResizeObserver' in window && document.documentElement) {
			resizeObserver = new ResizeObserver(resizeCanvas);
			resizeObserver.observe(document.documentElement);
		}
		const { startGame } = await import('$lib');
		if (game == null)
		{
			try
			{
				game = await startGame('maps/standard2player.map');
			}
			catch (err)
			{
				// console.warn('startGame(canvas, map) failed — falling back to startGame(map):', err);
				console.warn('startGame(canvas, map) failed)', err);
				// game = await (startGame as any)('maps/standard2player.map');
			}
			resizeCanvas();
		}
	});

	onDestroy(async () => {
		window.removeEventListener('resize', resizeCanvas);
		window.removeEventListener('orientationchange', resizeCanvas);
		resizeObserver?.disconnect();

		if (game != null) {
			const { destroyGame } = await import('$lib');
			await destroyGame(game);
			game = null;
		}
	});
</script>

<!-- Tailwind classes: make the canvas fill the viewport layout-wise -->
<canvas
	id="gameCanvas"
	bind:this={canvas}
	class="block w-screen h-screen touch-none bg-black"
></canvas>