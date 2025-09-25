import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import {
  GoogleMap,
  useLoadScript,
  Marker,
} from "@react-google-maps/api";
import { IssueListItem } from "../../store/slices/issueSlice";

interface MapProps {
  issues: IssueListItem[];
  onIssueClick: (issue: IssueListItem) => void;
  userLocation?: { lat: number; lng: number } | null;
  showUserLocation?: boolean;
  height?: string;
}

const Map: React.FC<MapProps> = ({
  issues,
  onIssueClick,
  userLocation,
  showUserLocation = false,
  height = "400px"
}) => {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  // Set map center based on user location or first issue
  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation);
    } else if (issues.length > 0 && issues[0].location?.coordinates) {
      const [lng, lat] = issues[0].location.coordinates;
      setMapCenter({ lat, lng });
    }
  }, [userLocation, issues]);

  const handleMarkerClick = (issue: IssueListItem) => {
    onIssueClick(issue);
  };

  if (loadError) {
    return (
      <Box p={2}>
        <Alert severity="error">
          Error loading Google Maps. Please check your API key configuration.
        </Alert>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ height, minHeight: "200px" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: "100%" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter}
        zoom={13}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* User Location Marker */}
        {showUserLocation && userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#2196f3" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(24, 24),
            }}
            title="Your Location"
          />
        )}

        {/* Issue Markers */}
        {issues
          .filter(issue => issue.location?.coordinates)
          .map((issue) => {
            const [lng, lat] = issue.location.coordinates;
            return (
              <Marker
                key={issue.id}
                position={{ lat, lng }}
                onClick={() => handleMarkerClick(issue)}
                icon={{
                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="14" fill="#ff4444" stroke="white" stroke-width="2"/>
                      <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">!</text>
                    </svg>
                  `)}`,
                  scaledSize: new google.maps.Size(32, 32),
                }}
                title={issue.title}
              />
            );
          })}
      </GoogleMap>
    </Box>
  );
};

export default Map;