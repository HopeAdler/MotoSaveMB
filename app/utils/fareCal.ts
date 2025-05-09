// src/utils/fareCal.ts
import { getDistance } from 'geolib';
import { roundToThousand } from './utils';
export type LatLng = { latitude: number; longitude: number };
export type TripAction =
    | { type: 'START'; timestamp: number; coords: LatLng }
    | { type: 'UPDATE'; timestamp: number; coords: LatLng }
    | { type: 'END' };


export interface TripState {
    status: 'idle' | 'running' | 'done';
    lastTime: number;
    lastCoords: { latitude: number; longitude: number };
    distance: number;
    waiting: number;
    fare: number;
}
// —— TARIFF SETTINGS ——
const FLAGFALL = 50000;            // VNĐ cờ mở cửa flood
const FIRST_FREE = 500;            // mét đầu miễn phí
const RATE1 = 19200 / 1000;        // VNĐ/m cho <30km
const RATE2 = 17000 / 1000;        // VNĐ/m cho >=30km
const WAIT_RATE = 60000 / 3600;    // VNĐ/s chờ
const MIN_MOVE = 3;                // mét, loại jitter
const MAX_SPEED = 120;             // km/h, loại nhảy toạc

/**
 * Tính tiền dựa trên tổng distance (m) và waiting time (s)
 */
export function calculateFare(distance: number, waiting: number): number {
    let fare = FLAGFALL;
    const chargeDist = Math.max(0, distance - FIRST_FREE);
    if (chargeDist <= 30000) {
        fare += chargeDist * RATE1;
    } else {
        fare += 30000 * RATE1 + (chargeDist - 30000) * RATE2;
    }
    fare += waiting * WAIT_RATE;
    return Math.round(fare);
}

/**
 * Reducer quản lý trạng thái chuyến: idle → running → done
 */
export function tripReducer(
    state: TripState,
    action: TripAction
): TripState {
    switch (action.type) {
        case 'START':
            return {
                status: 'running',
                lastTime: action.timestamp,
                lastCoords: action.coords,
                distance: 0,
                waiting: 0,
                fare: FLAGFALL,
            };

        case 'UPDATE':
            if (state.status !== 'running') return state;

            const dt = (action.timestamp - state.lastTime) / 1000;
            console.log('prevCoords=', state.lastCoords, 'newCoords=', action.coords);
            const d = getDistance(state.lastCoords, action.coords);
            console.log('prevCoords=', state.lastCoords, 'newCoords=', action.coords);
            const speed = (d / dt) * 3.6; // km/h
            const moved = d > MIN_MOVE && speed < MAX_SPEED;

            const newDistance = state.distance + (moved ? d : 0);
            const newWaiting = state.waiting + (moved ? 0 : dt);
            const newFare = calculateFare(newDistance, newWaiting);
            // const roundedFare = roundToThousand(newFare);

            return {
                status: 'running',
                lastTime: action.timestamp,
                lastCoords: action.coords,
                distance: newDistance,
                waiting: newWaiting,
                fare: newFare,
                // fare: roundedFare
            };

        case 'END':
            return { ...state, status: 'done' };

        default:
            return state;
    }
}
