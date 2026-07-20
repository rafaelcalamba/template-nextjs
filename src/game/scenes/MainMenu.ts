import { Scene, GameObjects, Geom, Math as PhaserMath } from 'phaser';
import { EventBus } from '../EventBus';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { bindLayout, fitImage, getUiScale } from '../utils/layout';
import { fontStyles } from '../utils/fonts';

export class MainMenu extends Scene
{
    #cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys | undefined;

    #player: GameObjects.Image;
    #playerSpeed: number = 5;
    #playerHealth: number;

    #bullets: GameObjects.Image[] = [];
    #bulletSpeed: number = 20;

    #stars: GameObjects.Image[] = [];
    #starSpeed: number = 2;
    #starDamage: number = 10;

    #score: number;
    #scoreIncrement: number = 10;

    background: GameObjects.Image;
    logo: GameObjects.Image;
    score: GameObjects.Text;
    health: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.#cursorKeys = this.input.keyboard?.createCursorKeys();

        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.background = this.add.image(centerX, centerY, 'background');
        this.logo = this.add.image(centerX, height * 0.39, 'logo').setDepth(10).setVisible(false);

        this.score = this.add.text(0, 0, 'Score: 00', {
            ...fontStyles.body
        }).setOrigin(0.5).setDepth(10);
        this.health = this.add.text(0, 0, `Health: ${this.#playerHealth}`, {
            ...fontStyles.body
        }).setOrigin(0.5).setDepth(10);

        this.#player = this.add.sprite(centerX, height * 0.9, 'player').setDepth(100);

        bindLayout(this, this.layout.bind(this));

        this.time.addEvent({
            delay: 250,
            callback: this.#fireBullet,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 1000,
            callback: () => this.#spawnStars(width),
            callbackScope: this,
            loop: true
        });

        EventBus.emit('current-scene-ready', this);
    }

    init ()
    {
        this.#playerHealth = 100;
        this.#score = 0;
    }

    private layout (width: number, height: number)
    {
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        this.background.setPosition(centerX, centerY);
        this.logo.setPosition(centerX, height * 0.39);
        this.score.setPosition(this.score.width * 0.6, this.score.height * 0.6);
        this.health.setPosition(width - this.health.width * 0.6, this.health.height * 0.6);
        this.#player.setPosition(centerX, height * 0.9);

        const bgScale = Math.max(width / this.background.width, height / this.background.height);
        this.background.setScale(bgScale);

        const uiScale = getUiScale(width, height);
        fitImage(this.logo, GAME_WIDTH * 0.6 * uiScale, GAME_HEIGHT * 0.22 * uiScale);
        fitImage(this.#player, GAME_WIDTH * 0.2 * uiScale, GAME_HEIGHT * 0.1 * uiScale);
        // this.score.setFontSize(Math.round(12 * uiScale));
    }

    #fireBullet() {
        const bullet = this.add.image(this.#player.x, this.#player.y - this.#player.height * 0.5, 'bullet')
        .setTint(PhaserMath.Between(0, 0xffffff))
        .setDepth(50)
        .setScale(0.5);
        this.#bullets.push(bullet);
    }

    #spawnStars (width: number, count: number = 3) {
        for (let i = 0; i < count; i++) {
            const star = this.add.image(0, 0, 'star')
                .setAlpha(0)
                .setTint(PhaserMath.Between(0, 0xffffff))
                .setDepth(50);
            star.x = PhaserMath.Between(0 + star.width * 0.5, width - star.width * 0.5);
            this.tweens.add({ targets: star, alpha: 1, duration: 250 });
            this.#stars.push(star);
        }
    }
    
    update (time: number, delta: number)
    {
        const playerSpeed = this.#playerSpeed * (delta / 16.6667);
        if (this.#cursorKeys?.left.isDown)
        {
            this.#player.x -= playerSpeed;
        }
        else if (this.#cursorKeys?.right.isDown)
        {
            this.#player.x += playerSpeed;
        }
        else if (this.#cursorKeys?.up.isDown)
        {
            this.#player.y -= playerSpeed;
        }
        else if (this.#cursorKeys?.down.isDown)
        {
            this.#player.y += playerSpeed;
        }

        const { width, height } = this.scale;
        const playerHalfWidth = this.#player.width * 0.5;
        const playerHalfHeight = this.#player.height * 0.5;
        if (this.#player.x - playerHalfWidth < 0)
        {
            this.#player.x = playerHalfWidth;
        }
        else if (this.#player.x + playerHalfWidth > width)
        {
            this.#player.x = width - playerHalfWidth;
        }
        if (this.#player.y - playerHalfHeight < 0)
        {
            this.#player.y = playerHalfHeight;
        }
        else if (this.#player.y + playerHalfHeight > height)
        {
            this.#player.y = height - playerHalfHeight;
        }

        const starSpeed = this.#starSpeed * (delta / 16.6667);
        for (let i = this.#stars.length - 1; i >= 0; i--)
        {
            const star = this.#stars[i];
            star.y += starSpeed;

            if (star.y > height)
            {
                star.destroy();
                this.#stars.splice(i, 1);
                continue;
            }

            const isColliding = this.isColliding(star, this.#player);
            if (isColliding) {
                this.#playerHealth -= this.#starDamage;
                if (this.#playerHealth <= 0) {
                    this.changeScene('GameOver');
                }
                this.health.setText(`Health: ${this.#playerHealth}`);

                this.fadeAndDestroy(star);
                this.#stars.splice(i, 1);
            }
        }

        const bulletSpeed = this.#bulletSpeed * (delta / 16.6667);
        for (let i = this.#bullets.length - 1; i >= 0; i--)
        {
            const bullet = this.#bullets[i];
            bullet.y -= bulletSpeed;

            if (bullet.y + bullet.height * 0.5 < 0)
            {
                bullet.destroy();
                this.#bullets.splice(i, 1);
                continue;
            }

            for (let j = this.#stars.length - 1; j >= 0; j--)
            {
                const star = this.#stars[j];
                const isColliding = this.isColliding(bullet, star);
                if (isColliding)
                {
                    this.#score += this.#scoreIncrement;
                    this.score.setText(`Score: ${this.#score}`);

                    bullet.destroy();
                    this.#bullets.splice(i, 1);
                    
                    this.fadeAndDestroy(star);
                    this.#stars.splice(j, 1);
                    break;
                }
            }
        }
    }

    isColliding (gameObject1: GameObjects.Image, gameObject2: GameObjects.Image): boolean {
        const objectBounds = gameObject1.getBounds();
        const otherBounds = gameObject2.getBounds();
        return Geom.Intersects.RectangleToRectangle(objectBounds, otherBounds);
    }

    fadeAndDestroy(gameObject: GameObjects.Image) {
        this.tweens.add({
            targets: gameObject,
            alpha: 0,
            duration: 250,
            onComplete: () => {
                gameObject.destroy();
            }
        });
    }
    
    changeScene (sceneKey: string)
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start(sceneKey);
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
