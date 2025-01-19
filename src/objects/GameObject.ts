import {Vec2D} from "../types/math";

export default class GameObject {
    private _position: Vec2D = { x: 0, y: 0 };
    boxCollider = null;


    get position(): Vec2D {
        return this._position;
    }

    setPosition(x: number, y: number): void {
        this._position = { x, y };
    }

    update(): void {}
}
