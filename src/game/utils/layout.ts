import { GameObjects, Scene } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const bindLayout = (
    scene: Scene,
    applyLayout: (width: number, height: number) => void
) => {
    const onResize = () => {
        applyLayout(scene.scale.width, scene.scale.height);
    };

    onResize();
    scene.scale.on('resize', onResize);

    scene.events.once('shutdown', () => {
        scene.scale.off('resize', onResize);
    });
};

export const getUiScale = (
    width: number,
    height: number,
    baseWidth = GAME_WIDTH,
    baseHeight = GAME_HEIGHT
) => {
    return Math.min(width / baseWidth, height / baseHeight);
};

export const fitImage = (
    image: GameObjects.Image,
    maxWidth: number,
    maxHeight: number,
    maxScale = 1
) => {
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, maxScale);
    image.setScale(scale);

    return scale;
};