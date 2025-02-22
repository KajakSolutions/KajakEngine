import { describe, expect, test } from '@jest/globals';
import {
    vec2D,
    add,
    subtract,
    multiply,
    divide,
    length,
    squaredLength,
    normalize,
    dotProduct,
    degreesToRadians
} from '../math';

describe('Math Utilities', () => {
    describe('vec2D', () => {
        test('creates a 2D vector with correct components', () => {
            const v = vec2D(3, 4);
            expect(v.x).toBe(3);
            expect(v.y).toBe(4);
        });

        test('handles negative values', () => {
            const v = vec2D(-2, -5);
            expect(v.x).toBe(-2);
            expect(v.y).toBe(-5);
        });
    });

    describe('add', () => {
        test('adds two vectors correctly', () => {
            const v1 = vec2D(1, 2);
            const v2 = vec2D(3, 4);
            const result = add(v1, v2);
            expect(result).toEqual(vec2D(4, 6));
        });

        test('handles negative values', () => {
            const v1 = vec2D(-1, 2);
            const v2 = vec2D(3, -4);
            const result = add(v1, v2);
            expect(result).toEqual(vec2D(2, -2));
        });
    });

    describe('subtract', () => {
        test('subtracts two vectors correctly', () => {
            const v1 = vec2D(5, 8);
            const v2 = vec2D(2, 3);
            const result = subtract(v1, v2);
            expect(result).toEqual(vec2D(3, 5));
        });

        test('handles negative values', () => {
            const v1 = vec2D(-1, 2);
            const v2 = vec2D(3, -4);
            const result = subtract(v1, v2);
            expect(result).toEqual(vec2D(-4, 6));
        });
    });

    describe('multiply', () => {
        test('multiplies vector by scalar correctly', () => {
            const v = vec2D(2, 3);
            const result = multiply(v, 2);
            expect(result).toEqual(vec2D(4, 6));
        });

        test('handles negative scalar', () => {
            const v = vec2D(2, 3);
            const result = multiply(v, -2);
            expect(result).toEqual(vec2D(-4, -6));
        });

        test('multiplies by zero', () => {
            const v = vec2D(2, 3);
            const result = multiply(v, 0);
            expect(result).toEqual(vec2D(0, 0));
        });
    });

    describe('divide', () => {
        test('divides vector by scalar correctly', () => {
            const v = vec2D(4, 6);
            const result = divide(v, 2);
            expect(result).toEqual(vec2D(2, 3));
        });

        test('handles negative scalar', () => {
            const v = vec2D(4, 6);
            const result = divide(v, -2);
            expect(result).toEqual(vec2D(-2, -3));
        });

        test('throws error when dividing by zero', () => {
            const v = vec2D(4, 6);
            expect(() => divide(v, 0)).toThrow("You can't divide by zero!");
        });
    });

    describe('length', () => {
        test('calculates vector length correctly', () => {
            const v = vec2D(3, 4);
            expect(length(v)).toBe(5);
        });

        test('handles zero vector', () => {
            const v = vec2D(0, 0);
            expect(length(v)).toBe(0);
        });

        test('handles negative components', () => {
            const v = vec2D(-3, -4);
            expect(length(v)).toBe(5);
        });
    });

    describe('squaredLength', () => {
        test('calculates squared length correctly', () => {
            const v = vec2D(3, 4);
            expect(squaredLength(v)).toBe(25);
        });

        test('handles zero vector', () => {
            const v = vec2D(0, 0);
            expect(squaredLength(v)).toBe(0);
        });
    });

    describe('normalize', () => {
        test('normalizes vector correctly', () => {
            const v = vec2D(3, 4);
            const result = normalize(v);
            expect(result.x).toBeCloseTo(0.6);
            expect(result.y).toBeCloseTo(0.8);
        });

        test('throws error when normalizing zero vector', () => {
            const v = vec2D(0, 0);
            expect(() => normalize(v)).toThrow();
        });
    });

    describe('dotProduct', () => {
        test('calculates dot product correctly', () => {
            const v1 = vec2D(2, 3);
            const v2 = vec2D(4, 5);
            expect(dotProduct(v1, v2)).toBe(23);
        });

        test('handles perpendicular vectors', () => {
            const v1 = vec2D(1, 0);
            const v2 = vec2D(0, 1);
            expect(dotProduct(v1, v2)).toBe(0);
        });
    });

    describe('degreesToRadians', () => {
        test('converts degrees to radians correctly', () => {
            expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
            expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
            expect(degreesToRadians(0)).toBe(0);
        });
    });
});
