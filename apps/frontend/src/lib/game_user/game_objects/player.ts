import { Paddle, Goal, Wall } from '../../index';

export class Player
{
	private name:		string;
	private score:		number;
	private lives:		number;
	private goal:		Goal;
	private paddle:		Paddle;
	private controlKeys:	[string, string] = ['', ''];
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

	checkForActions(keys: Record<string, boolean>, walls: Wall[])
	{
		const keyDownIsPressed = keys[this.controlKeys[0]];
		const keyUpIsPressed = keys[this.controlKeys[1]];

		if (keyUpIsPressed == true || keyDownIsPressed == true)
		{
			if (keyUpIsPressed == true)
			{
				this.paddle.update(1, true, walls);
			}
			if (keyDownIsPressed == true)
			{
				this.paddle.update(-1, true, walls);
			}
		}
		else
		{
			this.paddle.update(0, false, walls);
		}
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

	setControls(keyUp: string, keyDown: string)
	{
		this.controlKeys[0] = keyUp;
		this.controlKeys[1] = keyDown;
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
