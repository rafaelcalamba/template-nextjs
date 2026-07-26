import { Scene, Math as PhaserMath } from 'phaser';
import { EventBus } from '../EventBus';
import { DepthLayers } from '../config';
import { fontStyles } from '../utils/fonts';

export class Game extends Scene
{
    #camera: Phaser.Cameras.Scene2D.Camera;
    #background: Phaser.GameObjects.Image;
    #gameText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.#camera = this.cameras.main;
        this.#camera.setBackgroundColor(0x00ff00);

        this.#background = this.add.image(centerX, centerY, 'background')
        .setTint(PhaserMath.Between(0, 0xffffff))
        .setDepth(DepthLayers.Background)
        .setAlpha(0.5);

        this.#gameText = this.add.text(centerX, centerY, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
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
        this.scene.start('GameOver');
    }
}
