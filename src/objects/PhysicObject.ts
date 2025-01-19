import GameObject, {GameObjectOptions} from "./GameObject.ts";

export type PhysicObjectOptions = GameObjectOptions & {
    angularVelocity?: number;
    speed?: number;
}

export default class PhysicObject extends GameObject {
    private _angularVelocity: number;
    private _speed: number;

    constructor(config: PhysicObjectOptions) {
      super(config);

      this._angularVelocity = config.angularVelocity || 0;
      this._speed = config.speed || 0;
    }

    speedUp(delta: number): void {
      this._speed += delta;
    }

    turn(delta: number): void {
      this._angularVelocity *= 0.2;
      this.angle += delta;
    }

    update(): void {
      this.position.x += this._speed * Math.cos(this.angle);
      this.position.y += this._speed * Math.sin(this.angle);
      this.angle += this._angularVelocity;
    }
}
