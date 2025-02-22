import { describe, expect, test } from '@jest/globals';
import { LineCollider } from '../LineCollider';
import { vec2D } from '../../../utils/math';

describe('LineCollider', () => {
    describe('collision detection', () => {
        // test('detects collision when lines share endpoint with enough thickness', () => {
        //     const line1 = new LineCollider(vec2D(0, 0), vec2D(10.1, 0), 2);
        //     const line2 = new LineCollider(vec2D(9.9, 0), vec2D(20, 0), 2);
        //
        //     const collision = line1.checkCollision(line2);
        //     expect(collision).not.toBeNull();
        // });

        test('detects intersection between crossing lines', () => {
            const line1 = new LineCollider(vec2D(0, 0), vec2D(10, 10), 1);
            const line2 = new LineCollider(vec2D(0, 10), vec2D(10, 0), 1);

            const collision = line1.checkCollision(line2);
            expect(collision).not.toBeNull();
            if (collision) {
                expect(collision.contactPoints.length).toBeGreaterThan(0);
            }
        });

        test('no collision when lines are parallel and far apart', () => {
            const line1 = new LineCollider(vec2D(0, 0), vec2D(10, 0), 1);
            const line2 = new LineCollider(vec2D(0, 5), vec2D(10, 5), 1);

            const collision = line1.checkCollision(line2);
            expect(collision).toBeNull();
        });
    });

    describe('bounding box and point containment', () => {
        test('returns correct bounding box with thickness', () => {
            const line = new LineCollider(vec2D(0, 0), vec2D(10, 10), 2);
            const box = line.getBoundingBox();

            expect(box.x).toBeLessThanOrEqual(-1); // thickness/2 margin
            expect(box.y).toBeLessThanOrEqual(-1);
            expect(box.width).toBeGreaterThanOrEqual(12); // width + thickness
            expect(box.height).toBeGreaterThanOrEqual(12);
        });

        test('correctly detects points near line considering thickness', () => {
            const line = new LineCollider(vec2D(0, 0), vec2D(10, 0), 2);

            expect(line.containsPoint(vec2D(5, 0))).toBe(true);
            expect(line.containsPoint(vec2D(5, 0.9))).toBe(true);
            expect(line.containsPoint(vec2D(5, 2))).toBe(false);
        });
    });
});
