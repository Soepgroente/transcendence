import { Paddle, Goal } from '../index';

export class Player
{
	private name:		string;
	private score:		number;
	private lives:		number;
	private goal:		Goal;
	private paddle:		Paddle;
	public	ID:			number;

	constructor(name: string, _id: number, goal: Goal, paddle: Paddle)
	{
		this.name = name;
		this.score = 0;
		this.lives = 3;
		this.ID = _id;
		this.goal = goal;
		this.paddle = paddle;
	}

	getName(): string
	{
		return this.name;
	}

	getLives(): number
	{
		return this.lives;
	}

	incrementScore(): void
	{
		this.score++;
	}

	loseLife()
	{
		this.lives--;
		if (this.lives <= 0)
		{
			this.eliminate();
		}
	}

	isAlive(): boolean
	{
		return this.lives > 0;
	}

	private eliminate()
	{
		this.paddle.eliminate();
		this.goal.eliminate();
	}
}
