import PhysicObject, { PhysicObjectOptions } from "./PhysicObject.ts";
import { Vec2D } from "../types/math";
import { vec2D } from "../utils/math.ts";
import { LineCollider } from "./Colliders/LineCollider.ts";

export interface BarrierSegmentOptions extends Omit<PhysicObjectOptions, 'collider'> {
    start: Vec2D;
    end: Vec2D;
    thickness: number;
}

export class BarrierSegment extends PhysicObject {
    private readonly _start: Vec2D;
    private readonly _end: Vec2D;
    private readonly _thickness: number;

    constructor({ start, end, thickness, ...options }: BarrierSegmentOptions) {
        const collider = new LineCollider(start, end, thickness);

        super({
            ...options,
            position: vec2D(0, 0),
            collider,
            movable: false
        });

        this._start = start;
        this._end = end;
        this._thickness = thickness;
    }

    get start(): Vec2D {
        return this._start;
    }

    get end(): Vec2D {
        return this._end;
    }

    get thickness(): number {
        return this._thickness;
    }
}

export interface TrackBarriersOptions {
    segments: {
        start: Vec2D;
        end: Vec2D;
    }[];
    thickness: number;
}

export class TrackBarriers {
    private readonly _segments: BarrierSegment[] = [];

    constructor(options: TrackBarriersOptions) {
        this._segments = options.segments.map(segment => {
            return new BarrierSegment({
                start: segment.start,
                end: segment.end,
                thickness: options.thickness,
                mass: 1000000,
            });
        });
    }

    get segments(): BarrierSegment[] {
        return this._segments;
    }

    addToScene(scene: any): void {
        this._segments.forEach(segment => {
            scene.addObject(segment);
        });
    }
}
