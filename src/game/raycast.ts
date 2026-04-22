import {
  HORIZONTAL_FOV,
  TEX_SIZE,
  WallType,
  getProjectionPlaneDistance,
  getVerticalFov,
} from './types';

export interface CameraBasis {
  dirX: number;
  dirY: number;
  planeX: number;
  planeY: number;
  projectionPlaneDistance: number;
  horizontalFov: number;
  verticalFov: number;
}

export interface RayHit {
  hit: boolean;
  distance: number; // perpendicular distance in tile units
  mapX: number;
  mapY: number;
  side: 0 | 1;
  wallType: WallType;
  wallX: number;
  texX: number;
  rayDirX: number;
  rayDirY: number;
}

export function buildCameraBasis(angle: number): CameraBasis {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const planeScale = Math.tan(HORIZONTAL_FOV / 2);

  return {
    dirX,
    dirY,
    planeX: -dirY * planeScale,
    planeY: dirX * planeScale,
    projectionPlaneDistance: getProjectionPlaneDistance(),
    horizontalFov: HORIZONTAL_FOV,
    verticalFov: getVerticalFov(),
  };
}

export function castRay(
  map: number[][],
  posX: number,
  posY: number,
  rayDirX: number,
  rayDirY: number,
  maxDistance: number,
): RayHit {
  let mapX = Math.floor(posX);
  let mapY = Math.floor(posY);

  const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
  const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

  let sideDistX: number;
  let sideDistY: number;
  let stepX: number;
  let stepY: number;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (posX - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - posX) * deltaDistX;
  }

  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (posY - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - posY) * deltaDistY;
  }

  let hit = false;
  let side: 0 | 1 = 0;
  let distance = 0;
  let wallType = WallType.EMPTY;

  while (!hit && distance < maxDistance) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) {
      hit = true;
      wallType = WallType.RED_BRICK;
    } else if (map[mapY][mapX] !== WallType.EMPTY) {
      hit = true;
      wallType = map[mapY][mapX] as WallType;
    }

    distance = side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;
  }

  if (!hit) {
    return {
      hit: false,
      distance: maxDistance,
      mapX,
      mapY,
      side,
      wallType: WallType.EMPTY,
      wallX: 0,
      texX: 0,
      rayDirX,
      rayDirY,
    };
  }

  let wallX = 0;
  if (side === 0) {
    wallX = posY + distance * rayDirY;
  } else {
    wallX = posX + distance * rayDirX;
  }
  wallX -= Math.floor(wallX);

  let texX = Math.floor(wallX * TEX_SIZE);
  if (side === 0 && rayDirX > 0) texX = TEX_SIZE - texX - 1;
  if (side === 1 && rayDirY < 0) texX = TEX_SIZE - texX - 1;

  return {
    hit: true,
    distance,
    mapX,
    mapY,
    side,
    wallType,
    wallX,
    texX,
    rayDirX,
    rayDirY,
  };
}
