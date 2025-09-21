import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button } from '@babylonjs/gui';
import { Scene, ActionManager, ExecuteCodeAction, KeyboardEventTypes } from '@babylonjs/core';
import { Game } from './game';

enum menus
{
	MAIN,
	SETTINGS,
	QUIT
}

export class GameMenu
{
	private menuTextures: AdvancedDynamicTexture []= [];
	private menuContainer: Rectangle[] = [];
	private buttons: Button[] = [];
	private selectedIndex: number;
	private isVisible: boolean;
	private scene: Scene;
	private game: Game;

	constructor(scene: Scene, game: Game)
	{
		this.scene = scene;
		this.game = game;
		this.selectedIndex = 0;
		this.isVisible = false;
		this.menuTextures.push(AdvancedDynamicTexture.CreateFullscreenUI('mainUI', true, scene));
		this.menuTextures.push(AdvancedDynamicTexture.CreateFullscreenUI('settingsUI', true, scene));
		this.menuContainer.push(new Rectangle());
		this.menuContainer.push(new Rectangle());
		this.setupMainMenu();
		this.setupSettingsMenu();
		this.setupKeyboardInput();
	}

	private setupMainMenu()
	{
		const x = menus.MAIN;

		this.menuContainer[x].widthInPixels = 400;
		this.menuContainer[x].heightInPixels = 300;
		this.menuContainer[x].cornerRadius = 10;
		this.menuContainer[x].color = 'black';
		this.menuContainer[x].thickness = 2;
		this.menuContainer[x].background = 'rgba(0, 0, 0, 0.8)';
		this.menuContainer[x].isVisible = false;
		this.menuTextures[x].addControl(this.menuContainer[x]);

		this.createMenuButton('RESUME', 0, x, () => this.toggleMenu(menus.MAIN));
		this.createMenuButton('SETTINGS', 1, x, () => this.openSettings());
		this.createMenuButton('QUIT', 2, x, () => this.quitGame());
		this.updateButtonStyles();
	}

	private setupSettingsMenu()
	{
		const x = menus.SETTINGS;

		this.menuContainer[x].widthInPixels = 400;
		this.menuContainer[x].heightInPixels = 300;
		this.menuContainer[x].cornerRadius = 10;
		this.menuContainer[x].color = 'black';
		this.menuContainer[x].thickness = 2;
		this.menuContainer[x].background = 'rgba(0, 0, 0, 0.8)';
		this.menuContainer[x].isVisible = false;
		this.menuTextures[x].addControl(this.menuContainer[x]);

		this.createMenuButton('BACK', 0, x, () => this.toggleMenu(menus.SETTINGS));
	}

	private createMenuButton(text: string, index: number, menu: menus, onClick: () => void)
	{
		const button = Button.CreateSimpleButton(`button_${index}`, text);

		button.widthInPixels = 200;
		button.heightInPixels = 50;
		button.color = 'black';
		button.fontSize = 20;
		button.background = 'transparent';
		button.topInPixels = (index - 1) * 70;
		this.menuContainer[menu].addControl(button);
		this.buttons.push(button);
	}

	private setupKeyboardInput()
	{
		this.scene.actionManager = new ActionManager(this.scene);

		this.scene.actionManager.registerAction(new ExecuteCodeAction
		(
			ActionManager.OnKeyDownTrigger, 
			(evt) =>
			{
				if (evt.sourceEvent.key === 'Escape')
				{
					this.toggleMenu(menus.MAIN);
				}
			}
		));

		this.scene.onKeyboardObservable.add((kbInfo) =>
		{
			if (this.isVisible == false)
			{
				return;
			}
			if (kbInfo.type === KeyboardEventTypes.KEYDOWN)
			{
				switch (kbInfo.event.key)
				{
					case 'ArrowUp': this.navigateUp(); break;
					case 'ArrowDown': this.navigateDown(); break;
					case 'Enter': this.selectCurrentButton(); break;
				}
			}
		});
	}

	private navigateUp()
	{
		this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
		this.updateButtonStyles();
	}

	private navigateDown()
	{
		this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
		this.updateButtonStyles();
	}

	private updateButtonStyles()
	{
		this.buttons.forEach((button, index) =>
		{
			if (index == this.selectedIndex)
			{
				button.background = 'rgba(255, 255, 255, 0.3)';
				button.color = 'yellow';
			}
			else
			{
				button.background = 'transparent';
				button.color = 'black';
			}
		});
		this.scene.render();
	}

	private selectCurrentButton()
	{
		console.log(`Selected: ${this.buttons[this.selectedIndex].name}`);
		this.updateButtonStyles();
	}

	public toggleMenu(menu: menus)
	{
		this.isVisible = !this.isVisible;
		this.menuContainer[menu].isVisible = this.isVisible;
		
		if (this.isVisible == true)
		{
			this.selectedIndex = 0;
			this.updateButtonStyles();
			if (this.game.gameRunning() == true)
			{
				this.game.toggleGamePause();
			}
			this.scene.render();
		}
		else
		{
			this.game.toggleGamePause();
		}
	}

	private openSettings()
	{
		// Implement settings menu
		console.log('Opening settings...');
	}

	private quitGame()
	{
		// Implement quit logic
		console.log('Quitting game...');
		// Maybe show confirmation dialog first
	}
}
