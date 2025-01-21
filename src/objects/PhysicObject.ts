import GameObject, {GameObjectOptions} from "./GameObject.ts";
import Collider from "./Colliders/Collider.ts";
import {Vec2D} from "../types/math";

export type PhysicObjectOptions = GameObjectOptions & {
    collider: Collider;
}

export default class PhysicObject extends GameObject {
    private _collider: Collider;
    constructor(config: PhysicObjectOptions) {
      super(config);
      this._collider = config.collider;
    }

    get collider(): Collider {
        return this._collider;
    }

    onCollision(): void {}

    update(): void {
    }

    set rotation(value: number) {
        this.collider.updatePosition(this.position, value);
    }

    set position(value: Vec2D) {
        this.collider.updatePosition(value);
    }
}
