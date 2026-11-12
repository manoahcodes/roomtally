import type { Room } from '../../types/project';
import { CalcValidationError } from './errors';

/** Floor area in m². */
export function floorArea(room: Pick<Room, 'lengthM' | 'widthM'>): number {
  return room.lengthM * room.widthM;
}

/** Ceiling area in m². A flat ceiling matches the floor. */
export function ceilingArea(room: Pick<Room, 'lengthM' | 'widthM'>): number {
  return floorArea(room);
}

/** All four walls before doors and windows, in m². */
export function grossWallArea(room: Pick<Room, 'lengthM' | 'widthM' | 'heightM'>): number {
  return 2 * (room.lengthM + room.widthM) * room.heightM;
}

/** Total area of doors and windows, in m². */
export function openingsArea(room: Pick<Room, 'openings'>): number {
  return room.openings.reduce((sum, o) => sum + o.widthM * o.heightM * o.count, 0);
}

/** Wall area after doors and windows, in m². Throws CALC_002 when nothing is left. */
export function netWallArea(
  room: Pick<Room, 'lengthM' | 'widthM' | 'heightM' | 'openings'>,
): number {
  const net = grossWallArea(room) - openingsArea(room);
  if (!(net > 0)) {
    throw new CalcValidationError('CALC_002', 'openings');
  }
  return net;
}
