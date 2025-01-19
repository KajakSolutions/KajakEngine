import {Vec2D} from "../types/math";

export type GameObjectOptions = {
    size: Vec2D;
    angle?: number;
    movable?: boolean;
    position: Vec2D;
}

export default class GameObject {
    private _position: Vec2D = { x: 0, y: 0 };
    private _size: Vec2D = { x: 0, y: 0 };
    private _angle: number = 0;
    private _movable: boolean = false;

    boxCollider = null;

    constructor(config: GameObjectOptions) {
        this._size = config.size ;
        this._angle = config.angle || 0;
        this._movable = config.movable || false;
        this._position = config.position
    }

    get size(): Vec2D {
        return this._size;
    }

    get angle(): number {
        return this._angle;
    }

    set angle(value: number) {
        this._angle = value;
    }

    get movable(): boolean {
        return this._movable;
    }

    get position(): Vec2D {
        return this._position;
    }

    setPosition(x: number, y: number): void {
        this._position = { x, y };
    }

    update(): void {}
}
