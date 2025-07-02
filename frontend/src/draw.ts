import {vec2} from './ball';

export function rectangle(drawFrom: vec2, dimensions: vec2)
{
	const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
	const ctx = canvas.getContext('2d')!;
	
	ctx.fillStyle = 'blue';
	ctx.fillRect(((drawFrom.x + 1) / 2) * canvas.width, ((drawFrom.y + 1) / 2) * canvas.height, dimensions.x * canvas.width, dimensions.y * canvas.height);
}

export function circle(radius: number, center: vec2)
{
	const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
	const ctx = canvas.getContext('2d')!;
	const midX = Math.floor(canvas.width / 2);
	const midY = Math.floor(canvas.height / 2);

	ctx.beginPath();
	ctx.arc((center.x + 1) * midX, (center.y + 1) * midY, radius, 0, Math.PI * 2);
	ctx.fillStyle = 'black';
	ctx.fill();
}