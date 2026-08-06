export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
export const GAME_UI_MARGIN = 4;
export const GAME_DELTA_MILLISECOND = 16.6667; // 60 FPS
export enum DepthLayers {
    Background = 0,
    UnderPlayer = 25,
    Player = 50,
    OverPlayer = 75,
    UI = 100
}