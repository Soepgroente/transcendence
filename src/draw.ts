import {vec2} from './ball';

export function rectangle(center: vec2, dimensions: vec2)
{
	const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
	const ctx = canvas.getContext('2d')!;
	const midX = Math.floor(canvas.width / 2);
	const midY = Math.floor(canvas.height / 2);
	
	ctx.fillStyle = 'blue';
	ctx.fillRect((center.x + 1) * midX, (center.y + 1) * midY, dimensions.x, dimensions.y);
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