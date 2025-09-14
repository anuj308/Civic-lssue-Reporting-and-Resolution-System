import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  currentLocation: LocationCoordinates | null;
  selectedLocation: LocationCoordinates | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

const initialState: LocationState = {
  currentLocation: null,
  selectedLocation: null,
  address: null,
  isLoading: false,
  error: null,
  permissionGranted: false,
};

export const requestLocationPermission = createAsyncThunk(
  'location/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return rejectWithValue('Location permission denied');
      }
      return true;
    } catch (error: any) {
      return rejectWithValue('Failed to request location permission');
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'location/getCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      
      // Reverse geocoding to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      let address = 'Unknown location';
      if (addresses.length > 0) {
        const addr = addresses[0];
        address = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
      }
      
      return {
        coordinates: { latitude, longitude },
        address,
      };
    } catch (error: any) {
      return rejectWithValue('Failed to get current location');
    }
  }
);

export const reverseGeocode = createAsyncThunk(
  'location/reverseGeocode',
  async (coordinates: LocationCoordinates, { rejectWithValue }) => {
    try {
      const addresses = await Location.reverseGeocodeAsync(coordinates);
      
      let address = 'Unknown location';
      if (addresses.length > 0) {
        const addr = addresses[0];
        address = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
      }
      
      return { coordinates, address };
    } catch (error: any) {
      return rejectWithValue('Failed to get address for location');
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setSelectedLocation: (state, action: PayloadAction<LocationCoordinates>) => {
      state.selectedLocation = action.payload;
    },
    clearSelectedLocation: (state) => {
      state.selectedLocation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Request Permission
    builder
      .addCase(requestLocationPermission.fulfilled, (state) => {
        state.permissionGranted = true;
        state.error = null;
      })
      .addCase(requestLocationPermission.rejected, (state, action) => {
        state.permissionGranted = false;
        state.error = action.payload as string;
      });

    // Get Current Location
    builder
      .addCase(getCurrentLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLocation = action.payload.coordinates;
        state.address = action.payload.address;
        state.error = null;
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reverse Geocode
    builder
      .addCase(reverseGeocode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(reverseGeocode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedLocation = action.payload.coordinates;
        state.address = action.payload.address;
        state.error = null;
      })
      .addCase(reverseGeocode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setSelectedLocation, 
  clearSelectedLocation, 
  clearError, 
  setAddress 
} = locationSlice.actions;

export default locationSlice.reducer;
