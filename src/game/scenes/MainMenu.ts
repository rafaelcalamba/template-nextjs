import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { bindLayout, fitImage } from '../utils/layout';
import { fontStyles } from '../utils/fonts';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.background = this.add.image(centerX, centerY, 'background');

        this.logo = this.add.image(centerX, height * 0.39, 'logo').setDepth(100);

        this.title = this.add.text(centerX, height * 0.6, 'Main Menu', {
            ...fontStyles.body
        }).setOrigin(0.5).setDepth(100);

        bindLayout(this, this.layout.bind(this));

        EventBus.emit('current-scene-ready', this);
    }

    private layout (width: number, height: number)
    {
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.background.setPosition(centerX, centerY);
        this.logo.setPosition(centerX, height * 0.39);
        this.title.setPosition(centerX, height * 0.6);

        const bgScale = Math.max(width / this.background.width, height / this.background.height);
        this.background.setScale(bgScale);

        fitImage(this.logo, width * 0.6, height * 0.22);
    }
    
    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start('Game');
    }

    moveLogo (reactCallback: ({ x, y }: { x: number, y: number }) => void)
    {
        const { width, height } = this.scale;

        if (this.logoTween)
        {
            this.logoTween.isPlaying() ? this.logoTween.pause() : this.logoTween.play();
        } 
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: width * 0.73, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: height * 0.08, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
