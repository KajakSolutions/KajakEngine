import {vec2D} from "../math.ts";
import {calculateGridPositions, setupStartingGrid, validateStartPositions} from "../gridPositionHelper.ts";
import CarObject from "../../objects/CarObject.ts";

describe('Grid Position Helper', () => {
    describe('calculateGridPositions', () => {
        test('calculates correct grid positions for simple config', () => {
            const config = {
                startPosition: vec2D(0, 0),
                spacing: vec2D(5, 5),
                carsPerRow: 2,
                totalCars: 4,
                gridAngle: 0
            };

            const positions = calculateGridPositions(config);

            expect(positions.length).toBe(4);
            expect(positions[0]).toEqual(vec2D(0, 0));
            expect(positions[1]).toEqual(vec2D(5, 0));
            expect(positions[2]).toEqual(vec2D(2.5, 5));
            expect(positions[3]).toEqual(vec2D(7.5, 5));
        });

        test('handles grid angle rotation', () => {
            const config = {
                startPosition: vec2D(0, 0),
                spacing: vec2D(5, 5),
                carsPerRow: 2,
                totalCars: 2,
                gridAngle: Math.PI / 4
            };

            const positions = calculateGridPositions(config);

            expect(positions.length).toBe(2);

            expect(positions[0].x).toBeCloseTo(0);
            expect(positions[0].y).toBeCloseTo(0);
            expect(positions[1].x).toBeCloseTo(5 * Math.cos(Math.PI / 4));
            expect(positions[1].y).toBeCloseTo(5 * Math.sin(Math.PI / 4));
        });
    });

    describe('validateStartPositions', () => {
        let mockCars: CarObject[];

        beforeEach(() => {
            mockCars = [
                {
                    position: vec2D(0, 0),
                    collider: {
                        checkCollision: jest.fn().mockReturnValue(null)
                    }
                },
                {
                    position: vec2D(10, 10),
                    collider: {
                        checkCollision: jest.fn().mockReturnValue(null)
                    }
                }
            ] as unknown as CarObject[];
        });

        test('returns true when no cars collide', () => {
            expect(validateStartPositions(mockCars)).toBe(true);
        });

        test('returns false when cars collide', () => {
            mockCars[0].collider.checkCollision = jest.fn().mockReturnValue({ collides: true });
            expect(validateStartPositions(mockCars)).toBe(false);
        });
    });

    describe('setupStartingGrid', () => {
        test('correctly positions cars in grid', () => {
            const mockCars = [
                {
                    position: vec2D(0, 0),
                    rotation: 0,
                    velocity: vec2D(1, 1)
                },
                {
                    position: vec2D(0, 0),
                    rotation: 0,
                    velocity: vec2D(1, 1)
                }
            ] as unknown as CarObject[];

            const finishLinePos = vec2D(100, 0);

            setupStartingGrid(mockCars, finishLinePos);

            expect(mockCars[0].position.x).toBeLessThan(finishLinePos.x);
            expect(mockCars[1].position.x).toBeLessThan(finishLinePos.x);

            mockCars.forEach(car => {
                expect(car.rotation).toBe(0);
                expect(car.velocity).toEqual(vec2D(0, 0));
            });
        });
    });
});
