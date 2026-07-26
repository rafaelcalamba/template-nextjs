import { Scene, Math as PhaserMath } from 'phaser';
import { EventBus } from '../EventBus';
import { DepthLayers } from '../config';
import { fontStyles } from '../utils/fonts';

export class GameOver extends Scene
{
    #score: number = 0;
    #camera: Phaser.Cameras.Scene2D.Camera;
    #background: Phaser.GameObjects.Image;
    #gameOverText: Phaser.GameObjects.Text;
    #scoreText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    init (data?: { score?: number })
    {
        this.#score = data?.score ?? 0;
    }

    create ()
    {
        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.#camera = this.cameras.main;
        this.#camera.setBackgroundColor(0xff0000);

        this.#background = this.add.image(centerX, centerY, 'background')
        .setTint(PhaserMath.Between(0, 0xffffff))
        .setDepth(DepthLayers.Background)
        .setAlpha(0.5);

        this.#gameOverText = this.add.text(centerX, centerY, `Game Over\nFinal Score: ${this.#score}`, {
            ...fontStyles.default
        }).setOrigin(0.5)
        .setDepth(DepthLayers.UI);

        this.events.once('shutdown', this.#cleanupRuntime, this);
        
        EventBus.emit('current-scene-ready', this);
    }

    #cleanupRuntime ()
    {
        this.time.removeAllEvents();
        this.tweens.killAll();
    }

    changeScene ()
    {
        this.#cleanupRuntime();
        this.scene.start('Level0');
    }
}
