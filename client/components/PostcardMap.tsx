"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Button,
  Stack,
  Group,
  Text,
  Image,
  Alert,
  Loader,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Heart, MapPin, Calendar, User, Plus } from "lucide-react";
import Map, {
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ScaleControl,
  AttributionControl,
  LogoControl,
} from "react-map-gl/maplibre";
import {
  getMyPostcardsApiPostcardsMyGet,
  getNearbyPostcardsApiPostcardsNearbyGet,
  getPostcardDetailApiPostcardsPostcardIdGet,
  collectPostcardApiPostcardsPostcardIdCollectPost,
} from "@/src/api/sdk.gen";
import type {
  UserPostcard,
  NearbyPostcard,
  PostcardDetail,
} from "@/src/api/types.gen";

interface PostcardMapProps {
  userLocation: {
    lat: number;
    lng: number;
  } | null;
  styleUrl: string;
}

interface PostcardMarker {
  id: string;
  current_lat: number;
  current_lon: number;
  isOwn: boolean;
  imageUrl: string;
}

export default function PostcardMap({
  userLocation,
  styleUrl,
}: PostcardMapProps) {
  const mapRef = useRef<any>(null);
  const [myPostcards, setMyPostcards] = useState<UserPostcard[]>([]);
  const [nearbyPostcards, setNearbyPostcards] = useState<NearbyPostcard[]>([]);
  const [selectedPostcard, setSelectedPostcard] =
    useState<PostcardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [detailOpened, { open: openDetail, close: closeDetail }] =
    useDisclosure(false);
  const [markersState, setMarkersState] = useState({
    userPos: { x: 0, y: 0 },
    postcards: [] as any[],
  });

  // Load postcards data
  const loadPostcards = useCallback(async () => {
    if (!userLocation) return;

    try {
      setIsLoading(true);

      // Load my postcards and nearby postcards in parallel
      const [myPostcardsResponse, nearbyPostcardsResponse] =
        await Promise.allSettled([
          getMyPostcardsApiPostcardsMyGet(),
          getNearbyPostcardsApiPostcardsNearbyGet({
            query: {
              lat: userLocation.lat,
              lon: userLocation.lng,
              radius: 1000, // 1000m radius
            },
          }),
        ]);

      // Handle my postcards
      if (
        myPostcardsResponse.status === "fulfilled" &&
        myPostcardsResponse.value.data
      ) {
        console.log("My postcards response:", myPostcardsResponse.value.data);
        const firstPostcard = myPostcardsResponse.value.data.postcards?.[0];
        console.log("First myPostcard sample:", firstPostcard);
        if (firstPostcard) {
          console.log("Fields available:", Object.keys(firstPostcard));
          console.log(
            "Current lat field:",
            firstPostcard.current_lat,
            typeof firstPostcard.current_lat,
          );
          console.log(
            "Current lon field:",
            firstPostcard.current_lon,
            typeof firstPostcard.current_lon,
          );
        }
        setMyPostcards(myPostcardsResponse.value.data.postcards);
      } else {
        console.error("Failed to load my postcards:", myPostcardsResponse);
      }

      // Handle nearby postcards
      if (
        nearbyPostcardsResponse.status === "fulfilled" &&
        nearbyPostcardsResponse.value.data
      ) {
        console.log(
          "Nearby postcards response:",
          nearbyPostcardsResponse.value.data,
        );
        const firstNearbyPostcard = nearbyPostcardsResponse.value.data[0];
        console.log("First nearbyPostcard sample:", firstNearbyPostcard);
        if (firstNearbyPostcard) {
          console.log(
            "Nearby fields available:",
            Object.keys(firstNearbyPostcard),
          );
          console.log(
            "Nearby current lat field:",
            firstNearbyPostcard.current_lat,
            typeof firstNearbyPostcard.current_lat,
          );
          console.log(
            "Nearby current lon field:",
            firstNearbyPostcard.current_lon,
            typeof firstNearbyPostcard.current_lon,
          );
        }
        setNearbyPostcards(nearbyPostcardsResponse.value.data);
      } else {
        console.error(
          "Failed to load nearby postcards:",
          nearbyPostcardsResponse,
        );
      }
    } catch (error) {
      console.error("Error loading postcards:", error);
      notifications.show({
        title: "エラー",
        message: "絵葉書の読み込みに失敗しました",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  // Load postcards when user location changes
  useEffect(() => {
    loadPostcards();
  }, [loadPostcards]);

  // Convert lat/lng to screen coordinates
  const latLngToPixel = (lat: number, lng: number) => {
    if (!mapRef.current) {
      console.log("latLngToPixel: mapRef not available");
      return { x: 0, y: 0 };
    }

    try {
      const map = mapRef.current.getMap();
      const point = map.project([lng, lat]);
      console.log(
        `latLngToPixel: (${lat}, ${lng}) -> (${point.x}, ${point.y})`,
      );
      return { x: point.x, y: point.y };
    } catch (error) {
      console.error(
        "latLngToPixel error:",
        error,
        `for coords (${lat}, ${lng})`,
      );
      return { x: 0, y: 0 };
    }
  };

  // Update marker positions when map moves or zooms
  const updateMarkerPositions = useCallback(() => {
    if (!mapRef.current || !userLocation) return;

    // Update user position
    const userPos = latLngToPixel(userLocation.lat, userLocation.lng);

    // Update postcard positions with deduplication
    const seenIds = new Set<string>();
    const postcardMarkers = [];

    // Add my postcards first (they take priority)
    myPostcards.forEach((postcard) => {
      if (!seenIds.has(postcard.postcard_id)) {
        seenIds.add(postcard.postcard_id);
        // Convert string coordinates to numbers (DynamoDB often stores numbers as strings)
        const lat =
          typeof postcard.current_position?.lat === "string"
            ? parseFloat(postcard.current_position.lat)
            : postcard.current_position?.lat;
        const lon =
          typeof postcard.current_position?.lon === "string"
            ? parseFloat(postcard.current_position.lon)
            : postcard.current_position?.lon;

        // Validate coordinates before conversion
        if (
          typeof lat === "number" &&
          typeof lon === "number" &&
          !isNaN(lat) &&
          !isNaN(lon)
        ) {
          const pos = latLngToPixel(lat, lon);
          postcardMarkers.push({
            id: postcard.postcard_id,
            x: pos.x,
            y: pos.y,
            isOwn: true,
          });
        } else {
          console.warn(
            "Invalid coordinates for myPostcard:",
            postcard.postcard_id,
            "raw:",
            postcard.current_position,
            "converted:",
            lat,
            lon,
          );
        }
      }
    });

    // Add nearby postcards (skip if already added)
    nearbyPostcards.forEach((postcard) => {
      if (!seenIds.has(postcard.postcard_id)) {
        seenIds.add(postcard.postcard_id);
        // Convert string coordinates to numbers (DynamoDB often stores numbers as strings)
        const lat =
          typeof postcard.current_position?.lat === "string"
            ? parseFloat(postcard.current_position.lat)
            : postcard.current_position?.lat;
        const lon =
          typeof postcard.current_position?.lon === "string"
            ? parseFloat(postcard.current_position.lon)
            : postcard.current_position?.lon;

        // Validate coordinates before conversion
        if (
          typeof lat === "number" &&
          typeof lon === "number" &&
          !isNaN(lat) &&
          !isNaN(lon)
        ) {
          const pos = latLngToPixel(lat, lon);
          postcardMarkers.push({
            id: postcard.postcard_id,
            x: pos.x,
            y: pos.y,
            isOwn: false,
          });
        } else {
          console.warn(
            "Invalid coordinates for nearbyPostcard:",
            postcard.postcard_id,
            "raw:",
            postcard.current_position,
            "converted:",
            lat,
            lon,
          );
        }
      }
    });

    console.log("Updating marker positions:", {
      myPostcards: myPostcards.length,
      nearbyPostcards: nearbyPostcards.length,
      postcardMarkers: postcardMarkers.length,
      uniqueIds: seenIds.size,
      sampleMarkers: postcardMarkers.slice(0, 2).map((m) => ({
        id: m.id,
        x: m.x,
        y: m.y,
        isOwn: m.isOwn,
      })),
    });

    // Log raw postcard coordinates
    if (myPostcards.length > 0) {
      console.log(
        "Sample myPostcards coords:",
        myPostcards.slice(0, 2).map((p) => ({
          id: p.postcard_id,
          current_position: p.current_position,
        })),
      );
    }
    if (nearbyPostcards.length > 0) {
      console.log(
        "Sample nearbyPostcards coords:",
        nearbyPostcards.slice(0, 2).map((p) => ({
          id: p.postcard_id,
          current_position: p.current_position,
        })),
      );
    }

    setMarkersState({
      userPos,
      postcards: postcardMarkers,
    });
  }, [userLocation, myPostcards, nearbyPostcards]);

  // Update markers when map moves
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    const handleMapMove = () => {
      updateMarkerPositions();
    };

    // Listen to map events
    map.on("move", handleMapMove);
    map.on("zoom", handleMapMove);
    map.on("rotate", handleMapMove);

    // Initial position update
    setTimeout(updateMarkerPositions, 100);

    return () => {
      map.off("move", handleMapMove);
      map.off("zoom", handleMapMove);
      map.off("rotate", handleMapMove);
    };
  }, [updateMarkerPositions]);

  // Handle postcard click
  const handlePostcardClick = async (postcardId: string) => {
    try {
      const response = await getPostcardDetailApiPostcardsPostcardIdGet({
        path: { postcard_id: postcardId },
      });

      if (response.data) {
        setSelectedPostcard(response.data);
        openDetail();
      }
    } catch (error) {
      console.error("Error loading postcard details:", error);
      notifications.show({
        title: "エラー",
        message: "絵葉書の詳細情報の読み込みに失敗しました",
        color: "red",
      });
    }
  };

  // Handle collect postcard
  const handleCollectPostcard = async () => {
    if (!selectedPostcard) return;

    try {
      setIsCollecting(true);

      await collectPostcardApiPostcardsPostcardIdCollectPost({
        path: { postcard_id: selectedPostcard.postcard_id },
      });

      notifications.show({
        title: "コレクション追加完了",
        message: "絵葉書をコレクションに追加しました",
        color: "green",
      });

      closeDetail();
      // Reload postcards to get updated data
      loadPostcards();
    } catch (error: any) {
      console.error("Error collecting postcard:", error);

      let errorMessage = "コレクションへの追加に失敗しました";
      if (error.status === 409) {
        errorMessage = "この絵葉書は既にコレクションに追加されています";
      } else if (error.status === 404) {
        errorMessage = "絵葉書が見つかりませんでした";
      }

      notifications.show({
        title: "エラー",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  if (!userLocation) {
    return (
      <div
        style={{
          width: "100vw",
          height: "calc(100vh - 60px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📍</div>
          <div style={{ fontSize: "1.2rem" }}>位置情報を取得中...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: "relative" }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: userLocation.lng,
            latitude: userLocation.lat,
            zoom: 14,
          }}
          style={{
            width: "100vw",
            height: "calc(100vh - 60px)",
          }}
          mapStyle={styleUrl}
        >
          <NavigationControl />
          <GeolocateControl />
          <FullscreenControl />
          <ScaleControl />
          <AttributionControl />
          <LogoControl />

          {/* Loading indicator */}
          {isLoading && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: "rgba(255,255,255,0.9)",
                padding: "8px 12px",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Group gap="xs">
                <Loader size="xs" />
                <Text size="sm">絵葉書を読み込み中...</Text>
              </Group>
            </div>
          )}

          {/* Debug info - temporary */}
          {!isLoading && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: "rgba(255,255,255,0.9)",
                padding: "8px 12px",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                fontSize: "12px",
              }}
            >
              <div>自分の投稿: {myPostcards.length}件</div>
              <div>近くの投稿: {nearbyPostcards.length}件</div>
              <div>画面上マーカー: {markersState.postcards.length}件</div>
              <div>
                ユーザー位置: ({markersState.userPos.x.toFixed(0)},{" "}
                {markersState.userPos.y.toFixed(0)})
              </div>
              {markersState.postcards.length > 0 && (
                <div>
                  マーカー1位置: ({markersState.postcards[0].x.toFixed(0)},{" "}
                  {markersState.postcards[0].y.toFixed(0)})
                </div>
              )}
            </div>
          )}
        </Map>

        {/* User location marker */}
        {userLocation && (
          <div
            style={{
              position: "absolute",
              top: markersState.userPos.y - 10,
              left: markersState.userPos.x - 10,
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#228be6",
              border: "3px solid white",
              boxShadow: "0 0 10px rgba(0,0,0,0.3)",
              pointerEvents: "none",
              zIndex: 1000,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {/* Postcard markers */}
        {markersState.postcards.map((marker, index) => (
          <div
            key={marker.id}
            style={{
              position: "absolute",
              top: marker.y,
              left: marker.x,
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "#ff6b6b",
              border: "3px solid white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              zIndex: 1001,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
            }}
            onClick={() => handlePostcardClick(marker.id)}
          >
            <span style={{ fontSize: "20px" }}>📍</span>
          </div>
        ))}
      </div>

      {/* Postcard Detail Modal */}
      <Modal
        opened={detailOpened}
        onClose={closeDetail}
        title="絵葉書の詳細"
        size="md"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        {selectedPostcard && (
          <Stack gap="md">
            {/* Postcard Image */}
            <Image
              src={selectedPostcard.image_url}
              alt="絵葉書"
              radius="md"
              style={{ maxHeight: 300, objectFit: "contain" }}
              fallbackSrc="https://via.placeholder.com/300x200?text=No+Image"
            />

            {/* Postcard Text */}
            <Text size="lg" fw={500}>
              {selectedPostcard.text}
            </Text>

            {/* Location Info */}
            <Group gap="xs">
              <MapPin size={16} color="#868e96" />
              <Text size="sm" c="dimmed">
                {typeof selectedPostcard.current_position?.lat === "string"
                  ? parseFloat(selectedPostcard.current_position.lat).toFixed(4)
                  : selectedPostcard.current_position?.lat?.toFixed(4)}
                ,{" "}
                {typeof selectedPostcard.current_position?.lon === "string"
                  ? parseFloat(selectedPostcard.current_position.lon).toFixed(4)
                  : selectedPostcard.current_position?.lon?.toFixed(4)}
              </Text>
            </Group>

            {/* Created Date */}
            <Group gap="xs">
              <Calendar size={16} color="#868e96" />
              <Text size="sm" c="dimmed">
                {new Date(selectedPostcard.created_at).toLocaleDateString(
                  "ja-JP",
                )}
              </Text>
            </Group>

            {/* Likes Count */}
            <Group gap="xs">
              <Heart size={16} color="#868e96" />
              <Text size="sm" c="dimmed">
                {selectedPostcard.likes_count} いいね
              </Text>
            </Group>

            {/* Owner Badge */}
            <Badge
              color={selectedPostcard.is_own ? "green" : "blue"}
              variant="light"
              leftSection={<User size={12} />}
            >
              {selectedPostcard.is_own ? "あなたの投稿" : "他のユーザーの投稿"}
            </Badge>

            {/* Action Buttons */}
            <Group justify="flex-end" gap="sm">
              <Button variant="light" color="gray" onClick={closeDetail}>
                閉じる
              </Button>

              {!selectedPostcard.is_own && (
                <Button
                  onClick={handleCollectPostcard}
                  loading={isCollecting}
                  disabled={isCollecting}
                  leftSection={!isCollecting ? <Plus size={16} /> : null}
                >
                  コレクションに保存
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
