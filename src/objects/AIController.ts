import CarObject from "./CarObject";
import { Vec2D } from "../types/math";
import { length, normalize, subtract, vec2D } from "../utils/math";

export class AIController {
    private car: CarObject;
    private waypoints: Vec2D[] = [];
    private currentWaypoint: number = 0;
    private readonly waypointRadius: number = 5;

    constructor(car: CarObject) {
        this.car = car;
    }

    setWaypoints(waypoints: Vec2D[]): void {
        this.waypoints = waypoints;
        this.currentWaypoint = 0;
    }

    update(): void {
        if (this.waypoints.length === 0) return;

        const target = this.waypoints[this.currentWaypoint];
        const toTarget = subtract(target, this.car.position);
        const distance = length(toTarget);

        // Check if we reached the waypoint
        if (distance < this.waypointRadius) {
            this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
            return;
        }

        // Calculate desired steering angle
        const forward = vec2D(Math.sin(this.car.rotation), Math.cos(this.car.rotation));
        const right = vec2D(Math.cos(this.car.rotation), -Math.sin(this.car.rotation));

        const normalizedToTarget = normalize(toTarget);
        const dot = forward.x * normalizedToTarget.x + forward.y * normalizedToTarget.y;
        const cross = forward.x * normalizedToTarget.y - forward.y * normalizedToTarget.x;

        // Steering
        const steerAngle = Math.atan2(cross, dot);
        this.car.setSteerAngle(Math.max(-Math.PI/4, Math.min(Math.PI/4, steerAngle)));

        // Throttle control
        const rightDot = right.x * normalizedToTarget.x + right.y * normalizedToTarget.y;
        const speedMultiplier = 1 - Math.abs(rightDot);

        if (dot > 0) {
            this.car.setThrottle(83.91 * speedMultiplier);
        } else {
            this.car.setThrottle(-30);
        }
    }
}
