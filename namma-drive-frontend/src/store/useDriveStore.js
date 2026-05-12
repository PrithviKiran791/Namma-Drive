import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDriveStore = create(
  persist(
    (set) => ({
      activeHub: null,
      currentLocation: null,
      routeSummary: null,
      routeGeometry: [],
      weatherCache: {},
      setActiveHub: (activeHub) => set({ activeHub }),
      setCurrentLocation: (currentLocation) => set({ currentLocation }),
      setRouteSnapshot: (routeSnapshot = {}) => set({
        routeSummary: routeSnapshot.summary || null,
        routeGeometry: routeSnapshot.geometry || [],
      }),
      setWeatherSnapshot: (key, value) => set((state) => ({
        weatherCache: {
          ...state.weatherCache,
          [key]: value,
        },
      })),
      clearRouteSnapshot: () => set({ routeSummary: null, routeGeometry: [] }),
    }),
    {
      name: 'namma-drive-store',
      partialize: (state) => ({
        activeHub: state.activeHub,
        currentLocation: state.currentLocation,
      }),
    }
  )
);