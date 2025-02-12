import { Vec2D } from "../types/math"
import { vec2D } from "./math.ts"
import CarObject from "../objects/CarObject.ts"

interface GridConfig {
    startPosition: Vec2D
    spacing: Vec2D
    carsPerRow: number
    totalCars: number
    gridAngle?: number
}

export function calculateGridPositions(config: GridConfig): Vec2D[] {
    const positions: Vec2D[] = []
    const {
        startPosition,
        spacing,
        carsPerRow,
        totalCars,
        gridAngle = 0,
    } = config

    for (let i = 0; i < totalCars; i++) {
        const row = Math.floor(i / carsPerRow)
        const col = i % carsPerRow

        const baseX = startPosition.x + col * spacing.x
        const baseY = startPosition.y + row * spacing.y

        const offsetX = row % 2 === 1 ? spacing.x / 2 : 0

        if (gridAngle !== 0) {
            const x = baseX + offsetX
            const y = baseY

            const rotatedX = x * Math.cos(gridAngle) - y * Math.sin(gridAngle)
            const rotatedY = x * Math.sin(gridAngle) + y * Math.cos(gridAngle)

            positions.push(vec2D(rotatedX, rotatedY))
        } else {
            positions.push(vec2D(baseX + offsetX, baseY))
        }
    }

    return positions
}

export function setupStartingGrid(cars: CarObject[], finishLine: Vec2D): void {
    const gridConfig: GridConfig = {
        startPosition: vec2D(finishLine.x - 5, finishLine.y),
        spacing: vec2D(4, 3),
        carsPerRow: 3,
        totalCars: cars.length,
        gridAngle: 0,
    }

    const startPositions = calculateGridPositions(gridConfig)

    cars.forEach((car, index) => {
        car.position = startPositions[index]
        car.rotation = 0
        car.velocity = vec2D(0, 0)
    })
}

export function validateStartPositions(cars: CarObject[]): boolean {
    for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) {
            const collision = cars[i].collider.checkCollision(cars[j].collider)
            if (collision) {
                return false
            }
        }
    }
    return true
}
