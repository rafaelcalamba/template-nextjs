import { Types } from 'phaser';

export const fontStyles = {
    body: {
        fontFamily: 'Inconsolata',
        fontSize: 12,
        color: '#000',
        stroke: '#fff',
        strokeThickness: 2,
        align: 'center'
    } as Types.GameObjects.TextStyle,

    title: {
        fontFamily: 'Arial Black',
        fontSize: 38,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center'
    } as Types.GameObjects.TextStyle,

    heading: {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
    } as Types.GameObjects.TextStyle,
};
