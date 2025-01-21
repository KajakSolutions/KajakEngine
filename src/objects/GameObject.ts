import {Vec2D} from "../types/math";

export type GameObjectOptions = {
    size?: Vec2D;
    rotation?: number;
    movable?: boolean;
    position?: Vec2D;
}

export default class GameObject {
    private _position: Vec2D;
    private _size: Vec2D;
    private _rotation: number;
    private _movable: boolean;

    boxCollider = null;

    constructor(config: GameObjectOptions) {
        this._size = config.size || { x: 0, y: 0 };
        this._rotation = config.rotation || 0;
        this._movable = config.movable || false;
        this._position = config.position || { x: 0, y: 0 };
    }

    get size(): Vec2D {
        return this._size;
    }

    set size(value: Vec2D) {
        this._size = value;
    }

    get angle(): number {
        return this._rotation;
    }

    set rotation(value: number) {
        this._rotation = value;
    }

    get movable(): boolean {
        return this._movable;
    }

    set movable(value: boolean) {
        this._movable = value;
    }

    get position(): Vec2D {
        return this._position;
    }

    set position(value: Vec2D) {
        this._position = value;
    }

    update(): void {}
}
