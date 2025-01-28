import { Vec2D } from "../types/math";
import SpriteManager from "./SpriteManager.ts";

export type GameObjectOptions = {
    size?: Vec2D;
    rotation?: number;
    movable?: boolean;
    position?: Vec2D;
    spriteManager?: SpriteManager;
};

export default class GameObject {
    public position: Vec2D;
    public size: Vec2D;
    public rotation: number;
    public movable: boolean;
    public spriteManager: SpriteManager | undefined;

    constructor({ size = { x: 0, y: 0 }, rotation = 0, movable = false, position = { x: 0, y: 0 }, spriteManager }: GameObjectOptions) {
        this.size = size;
        this.rotation = rotation;
        this.movable = movable;
        this.position = position;
        this.spriteManager = spriteManager;
    }



// @ts-ignore
    update(deltaTime: number): void {}
}
