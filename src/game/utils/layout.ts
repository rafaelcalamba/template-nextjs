import { GameObjects, Scene } from 'phaser';

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