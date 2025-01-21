import GameObject, {GameObjectOptions} from "./GameObject.ts";
import Collider from "./Colliders/Collider.ts";

export type PhysicObjectOptions = GameObjectOptions & {
    collider: Collider;
}

export default class PhysicObject extends GameObject {
    private _collider: Collider;

    constructor({ collider, ...options }: PhysicObjectOptions) {
        super(options);
        this._collider = collider;
    }


    get collider(): Collider {
        return this._collider;
    }

    onCollision(): void {}

    // @ts-ignore
    update(deltaTime: number): void {}
}
