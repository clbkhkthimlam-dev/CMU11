import { WorldMap, MapObstacle, MapWaypoint, MapAction, BackgroundTheme } from '../types/map';

export interface MapHistoryState {
  past: WorldMap[];
  present: WorldMap;
  future: WorldMap[];
}

/**
 * Applies an incremental action to the WorldMap without destroying existing state
 */
export function applyIncrementalMapAction(current: WorldMap, action: MapAction): WorldMap {
  const nextVersion = (current.metadata?.version || 1) + 1;
  const nowIso = new Date().toISOString();

  switch (action.type) {
    case 'ADD_OBSTACLE': {
      return {
        ...current,
        obstacles: [...current.obstacles, action.obstacle],
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    case 'UPDATE_OBSTACLE': {
      return {
        ...current,
        obstacles: current.obstacles.map(o => (o.id === action.id ? { ...o, ...action.updates } : o)),
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    case 'MOVE_OBSTACLE': {
      return {
        ...current,
        obstacles: current.obstacles.map(o => (o.id === action.id ? { ...o, xM: action.xM, zM: action.zM } : o)),
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    case 'SET_OBSTACLE_ENABLED': {
      return {
        ...current,
        obstacles: current.obstacles.map(o => (o.id === action.id ? { ...o, enabled: action.enabled } : o)),
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    case 'REMOVE_OBSTACLE': {
      return {
        ...current,
        obstacles: current.obstacles.filter(o => o.id !== action.id),
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    case 'ADD_WAYPOINT': {
      return {
        ...current,
        waypoints: [...current.waypoints, action.waypoint],
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    case 'REMOVE_WAYPOINT': {
      return {
        ...current,
        waypoints: current.waypoints.filter(w => w.id !== action.id),
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    case 'SET_THEME': {
      return {
        ...current,
        backgroundTheme: action.theme,
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    case 'UPDATE_PROPERTIES': {
      return {
        ...current,
        ...action.properties,
        metadata: {
          ...current.metadata,
          version: nextVersion,
          lastUpdated: nowIso,
        },
      };
    }

    default:
      return current;
  }
}
