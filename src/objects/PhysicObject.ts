import GameObject, {GameObjectOptions} from "./GameObject.ts";
import Collider, {ColliderInfo} from "./Colliders/Collider.ts";
import {Vec2D} from "../types/math";
import {vec2D} from "../utils/math.ts";

export type PhysicObjectOptions = GameObjectOptions & {
    collider: Collider;
}

export default class PhysicObject extends GameObject {
    private _collider: Collider;
    private _velocity: Vec2D = vec2D(0, 0);

    constructor({ collider, ...options }: PhysicObjectOptions) {
        super(options);
        this._collider = collider;
    }


    get collider(): Collider {
        return this._collider;
    }

    get velocity(): Vec2D {
        return this._velocity;
    }

    set velocity(value: Vec2D) {
        this._velocity = value;
    }

    // @ts-ignore
    onCollision(other: PhysicObject, collisionInfo: ColliderInfo): void {}

    // @ts-ignore
    update(deltaTime: number): void {}
}
