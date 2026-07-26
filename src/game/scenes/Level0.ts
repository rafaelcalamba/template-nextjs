import { Scene, GameObjects, Math as PhaserMath, Geom } from 'phaser';
import { EventBus } from '../EventBus';
import { GAME_WIDTH, GAME_HEIGHT, GAME_UI_MARGIN, DepthLayers } from '../config';
import { bindLayout, getUiScale, fitImage } from '../utils/layout';
import { fontStyles } from '../utils/fonts';

export class Level0 extends Scene
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

    #background: GameObjects.Image;
    #logo: GameObjects.Image;
    #scoreText: GameObjects.Text;
    #healthText: GameObjects.Text;
    #logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('Level0');
    }

    init ()
    {
        this.#bullets = [];
        this.#stars = [];
        this.#playerHealth = 100;
        this.#score = 0;
    }

    create ()
    {
        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.#background = this.add.image(centerX, centerY, 'background')
        .setTint(PhaserMath.Between(0, 0xffffff));
        this.#logo = this.add.image(centerX, height * 0.39, 'logo')
        .setDepth(DepthLayers.Background)
        .setVisible(false);

        this.#scoreText = this.add.text(0, 0, `Score: ${this.#score}`, {
            ...fontStyles.default
        }).setOrigin(0, 0)
        .setDepth(DepthLayers.UI);
        this.#healthText = this.add.text(0, 0, `Health: ${this.#playerHealth}`, {
            ...fontStyles.default
        }).setOrigin(1, 0)
        .setDepth(DepthLayers.UI);

        this.#player = this.add.sprite(centerX, height * 0.9, 'player')
        .setTint(PhaserMath.Between(0, 0xffffff))
        .setDepth(DepthLayers.Player);

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

        this.events.once('shutdown', this.#cleanupRuntime, this);

        this.#cursorKeys = this.input.keyboard?.createCursorKeys();
        EventBus.emit('current-scene-ready', this);
    }

    private layout (width: number, height: number)
    {
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        this.#background.setPosition(centerX, centerY);
        this.#logo.setPosition(centerX, height * 0.39);
        this.#scoreText.setPosition(GAME_UI_MARGIN, GAME_UI_MARGIN);
        this.#healthText.setPosition(width - GAME_UI_MARGIN, GAME_UI_MARGIN);
        this.#player.setPosition(centerX, height * 0.9);

        const bgScale = Math.max(width / this.#background.width, height / this.#background.height);
        this.#background.setScale(bgScale);

        const uiScale = getUiScale(width, height);
        fitImage(this.#logo, GAME_WIDTH * 0.6 * uiScale, GAME_HEIGHT * 0.22 * uiScale);
        fitImage(this.#player, GAME_WIDTH * 0.2 * uiScale, GAME_HEIGHT * 0.1 * uiScale);
    }

    #fireBullet() {
        const bullet = this.add.image(this.#player.x, this.#player.y - this.#player.height * 0.5, 'bullet')
        .setTint(PhaserMath.Between(0, 0xffffff))
        .setDepth(DepthLayers.OverPlayer)
        .setScale(0.5);
        this.#bullets.push(bullet);
    }

    #spawnStars (width: number, count: number = 5) {
        for (let i = 0; i < count; i++) {
            const star = this.add.image(0, 0, 'star')
                .setAlpha(0)
                .setTint(PhaserMath.Between(0, 0xffffff))
                .setDepth(DepthLayers.UnderPlayer);
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
                if (this.damagePlayer(this.#starDamage))
                {
                    return;
                }
                star.destroy();
                this.#stars.splice(i, 1);
                continue;
            }

            const isColliding = this.isColliding(star, this.#player);
            if (isColliding) {
                if (this.damagePlayer(this.#starDamage))
                {
                    return;
                }

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
                    this.#scoreText.setText(`Score: ${this.#score}`);

                    bullet.destroy();
                    this.#bullets.splice(i, 1);
                    
                    this.fadeAndDestroy(star);
                    // this.sound.play('explosion', { volume: 0.5 });
                    this.#stars.splice(j, 1);
                    break;
                }
            }
        }
    }

    damagePlayer (amount: number): boolean
    {
        this.#playerHealth -= amount;
        this.#healthText.setText(`Health: ${this.#playerHealth}`);
        this.#background.setTint(PhaserMath.Between(0, 0xffffff));

        if (this.#playerHealth <= 0)
        {
            this.changeScene('GameOver');
            return true;
        }

        return false;
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

    #cleanupRuntime ()
    {
        if (this.#logoTween)
        {
            this.#logoTween.stop();
            this.#logoTween = null;
        }

        this.time.removeAllEvents();
        for (const bullet of this.#bullets) {
            bullet.destroy();
        }
        this.#bullets = [];
        for (const star of this.#stars) {
            star.destroy();
        }
        this.#stars = [];
    }
    
    changeScene (sceneKey: string = 'Game')
    {
        this.#cleanupRuntime();

        this.scene.start(sceneKey, { score: this.#score });
    }

    moveLogo (reactCallback: ({ x, y }: { x: number, y: number }) => void)
    {
        const { width, height } = this.scale;

        if (this.#logoTween)
        {
            this.#logoTween.isPlaying() ? this.#logoTween.pause() : this.#logoTween.play();
        } 
        else
        {
            this.#logoTween = this.tweens.add({
                targets: this.#logo,
                x: { value: width * 0.73, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: height * 0.08, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.#logo.x),
                            y: Math.floor(this.#logo.y)
                        });
                    }
                }
            });
        }
    }
}
