import CarObject from "./CarObject"
import CheckpointObject from "./CheckpointObject"

export interface RaceResults {
    position: number
    time: number
    isPlayer: boolean
    carId: number
    laps: number
    bestLapTime: number
}

interface CarProgress {
    lastCheckpoint: number
    currentLap: number
    lapStartTime: number
    bestLapTime: number
    lapTimes: number[]
    lastCheckpointTime: number
}

export interface RaceConfiguration {
    totalLaps: number
    checkpointTimeout: number
}

export class RaceManager {
    private checkpoints: CheckpointObject[] = []
    private cars: Map<number, CarObject> = new Map()
    private raceStartTime: number = 0
    private raceResults: RaceResults[] = []
    private _isRaceFinished: boolean = false
    private carProgress: Map<number, CarProgress> = new Map()
    private readonly config: RaceConfiguration

    constructor(
        config: RaceConfiguration = { totalLaps: 3, checkpointTimeout: 20000 }
    ) {
        this.config = config
        this.raceStartTime = performance.now()
    }

    addCheckpoint(checkpoint: CheckpointObject): void {
        this.checkpoints.push(checkpoint)
        this.checkpoints.sort((a, b) => a.checkpointOrder - b.checkpointOrder)
    }

    addCar(car: CarObject): void {
        this.cars.set(car.id, car)
        this.carProgress.set(car.id, {
            lastCheckpoint: -1,
            currentLap: 0,
            lapStartTime: this.raceStartTime,
            bestLapTime: Infinity,
            lapTimes: [],
            lastCheckpointTime: this.raceStartTime,
        })
    }

    update(): void {
        const currentTime = performance.now()

        this.cars.forEach((car) => {
            const progress = this.carProgress.get(car.id)
            if (!progress) return

            if (
                currentTime - progress.lastCheckpointTime >
                this.config.checkpointTimeout
            ) {
                this.resetCarToLastCheckpoint(car)
                return
            }

            this.processCarCheckpoints(car, currentTime)
        })

        this.updateLeaderboard()
    }

    private processCarCheckpoints(car: CarObject, currentTime: number): void {
        const progress = this.carProgress.get(car.id)
        if (!progress) return

        const nextCheckpointIndex =
            (progress.lastCheckpoint + 1) % this.checkpoints.length
        const nextCheckpoint = this.checkpoints[nextCheckpointIndex]

        if (car.isPlayer) {
            this.checkpoints.forEach((cp) => {
                if (cp.spriteManager) cp.spriteManager.hidden = true
            })

            if (nextCheckpoint.spriteManager) {
                nextCheckpoint.spriteManager.hidden = false
            }
        }

        if (car.collider.checkCollision(nextCheckpoint.collider)) {
            progress.lastCheckpoint = nextCheckpointIndex
            progress.lastCheckpointTime = currentTime
            nextCheckpoint.activate(car)

            if (
                nextCheckpoint.isFinish &&
                nextCheckpointIndex === this.checkpoints.length - 1
            ) {
                this.completeLap(car, currentTime)
            }
        }
    }

    private completeLap(car: CarObject, currentTime: number): void {
        const progress = this.carProgress.get(car.id)
        if (!progress) return

        const lapTime = currentTime - progress.lapStartTime
        progress.lapTimes.push(lapTime)
        progress.bestLapTime = Math.min(progress.bestLapTime, lapTime)
        progress.currentLap++
        progress.lapStartTime = currentTime

        if (progress.currentLap >= this.config.totalLaps) {
            this.finishRace(car, currentTime)
        }

        this.onLapCompleted(
            car,
            progress.currentLap,
            lapTime,
            progress.bestLapTime
        )
    }

    private resetCarToLastCheckpoint(car: CarObject): void {
        const progress = this.carProgress.get(car.id)
        if (!progress) return

        const lastCheckpoint =
            this.checkpoints[Math.max(0, progress.lastCheckpoint)]
        car.position = lastCheckpoint.position
        car.velocity = { x: 0, y: 0 }

        const nextCheckpointIndex =
            (progress.lastCheckpoint + 1) % this.checkpoints.length
        const nextCheckpoint = this.checkpoints[nextCheckpointIndex]

        const direction = {
            x: nextCheckpoint.position.x - lastCheckpoint.position.x,
            y: nextCheckpoint.position.y - lastCheckpoint.position.y
        }

        car.rotation = Math.atan2(direction.x, direction.y)

        progress.lastCheckpointTime = performance.now()

        if (car.isPlayer) {
            this.checkpoints.forEach((cp) => {
                if (cp.spriteManager) cp.spriteManager.hidden = true
            })

            if (nextCheckpoint.spriteManager) {
                nextCheckpoint.spriteManager.hidden = false
            }
        }
    }

    private finishRace(car: CarObject, currentTime: number): void {
        const progress = this.carProgress.get(car.id)
        if (!progress) return

        const finishTime = (currentTime - this.raceStartTime) / 1000

        this.raceResults.push({
            position: this.raceResults.length + 1,
            time: finishTime,
            isPlayer: car.isPlayer,
            carId: car.id,
            laps: progress.currentLap,
            bestLapTime: progress.bestLapTime,
        })

        if (car.isPlayer) {
            this._isRaceFinished = true
        }
    }

    private updateLeaderboard(): void {
        const leaderboardData = Array.from(this.carProgress.entries())
            .map(([carId, progress]) => ({
                car: this.cars.get(carId)!,
                progress,
                totalDistance:
                    progress.currentLap * this.checkpoints.length +
                    progress.lastCheckpoint,
            }))
            .sort((a, b) => b.totalDistance - a.totalDistance)

        const leaderboardContainer = document.getElementById(
            "leaderboard-container"
        )
        if (leaderboardContainer) {
            leaderboardContainer.innerHTML = `
                <div class="leaderboard">
                    <h2>Race Progress</h2>
                    ${leaderboardData
                        .map(
                            (data, index) => `
                        <div class="leaderboard-entry">
                            <span>${index + 1}.</span>
                            <span>Car ${data.car.playerId}</span>
                            <span>Lap ${data.progress.currentLap + 1}/${this.config.totalLaps}</span>
                            <span>Best: ${
                                data.progress.bestLapTime !== Infinity
                                    ? (
                                          data.progress.bestLapTime / 1000
                                      ).toFixed(2)
                                    : "--"
                            }s</span>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            `
        }
    }

    private onLapCompleted(
        car: CarObject,
        lap: number,
        lapTime: number,
        bestLap: number
    ): void {
        if (car.isPlayer) {
            console.log(`Lap ${lap}/${this.config.totalLaps} completed!`)
            console.log(`Lap time: ${(lapTime / 1000).toFixed(2)}s`)
            console.log(`Best lap: ${(bestLap / 1000).toFixed(2)}s`)
        }
    }

    get isRaceFinished(): boolean {
        return this._isRaceFinished
    }

    get results(): RaceResults[] {
        return this.raceResults
    }

    getCarProgress(carId: number): CarProgress | undefined {
        return this.carProgress.get(carId)
    }
}
