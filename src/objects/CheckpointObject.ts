import PhysicObject, {PhysicObjectOptions} from "./PhysicObject.ts";
import CarObject from "./CarObject.ts";

export interface CheckpointObjectOptions extends PhysicObjectOptions {
    isFinishLine?: boolean;
    order: number;
}

export default class CheckpointObject extends PhysicObject {
    private readonly isFinishLine: boolean;
    private readonly order: number;
    private activated: boolean;

    constructor(options: CheckpointObjectOptions) {
        super(options);
        this.isFinishLine = options.isFinishLine || false;
        this.order = options.order;
        this.activated = options.order === 0;
    }

    get isActivated(): boolean {
        return this.activated;
    }

    activate(car: CarObject): void {
        if (!car.isPlayer) return;
        this.activated = true;
        console.log(`Checkpoint ${this.order} activated`);
    }

    get checkpointOrder(): number {
        return this.order;
    }

    get isFinish(): boolean {
        return this.isFinishLine;
    }
}
