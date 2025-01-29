import CarObject from "./CarObject";
import CheckpointObject from "./CheckpointObject";

export interface RaceResults {
    position: number;
    time: number;
    isPlayer: boolean;
    carId: number;
}

export class RaceManager {
    private checkpoints: CheckpointObject[] = [];
    private cars: Map<number, CarObject> = new Map();
    private raceStartTime: number = 0;
    private raceResults: RaceResults[] = [];
    private _isRaceFinished: boolean = false;

    constructor() {
        this.raceStartTime = performance.now();
    }

    addCheckpoint(checkpoint: CheckpointObject): void {
        this.checkpoints.push(checkpoint);
        // Sort checkpoints by order
        this.checkpoints.sort((a, b) => a.checkpointOrder - b.checkpointOrder);
    }

    addCar(car: CarObject): void {
        this.cars.set(car.id, car);
    }

    update(): void {
        this.cars.forEach(car => {
            if (car.isPlayer) {
                this.processPlayerCheckpoints(car);
            }
        });
    }

    private processPlayerCheckpoints(car: CarObject): void {
        const currentCheckpoint = this.checkpoints[car.lastCheckpoint + 1];
        if (!currentCheckpoint) return;

        if (car.collider.checkCollision(currentCheckpoint.collider)) {
            currentCheckpoint.activate(car);
            car.lastCheckpoint++;

            if (currentCheckpoint.isFinish && car.lastCheckpoint === this.checkpoints.length - 1) {
                this.finishRace(car);
            }
        }
    }

    private finishRace(car: CarObject): void {
        const finishTime = (performance.now() - this.raceStartTime) / 1000;
        this.raceResults.push({
            position: this.raceResults.length + 1,
            time: finishTime,
            isPlayer: car.isPlayer,
            carId: car.id
        });

        if (car.isPlayer) {
            this._isRaceFinished = true;
        }
    }

    get isRaceFinished(): boolean {
        return this._isRaceFinished;
    }

    get results(): RaceResults[] {
        return this.raceResults;
    }
}
