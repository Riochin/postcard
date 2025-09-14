import numpy as np
import math

R = 6_371_000.0


class MovingLettersAlgorithm:
    @staticmethod
    def m_to_lonlat(x: float, y: float, lat0_rad: float):
        """Convert from meters to longitude/latitude."""
        lat_rad = y / R + lat0_rad
        lon_rad = x / (R * math.cos(lat0_rad))
        return math.degrees(lon_rad), math.degrees(lat_rad)

    @staticmethod
    def latlon_to_xy(lat_deg: float, lon_deg: float, lat0_rad: float):
        """Convert from longitude/latitude to meters."""
        lat_rad = math.radians(lat_deg)
        lon_rad = math.radians(lon_deg)

        y = R * (lat_rad - lat0_rad)
        x = R * math.cos(lat0_rad) * lon_rad
        return x, y

    def load_wpack_from_npz(self, npz_path: str):
        """Load wind pack from npz file."""
        data = np.load(npz_path)

        # Debug: log available keys
        print(f"Available keys in npz file: {list(data.keys())}")

        # Try to map the available keys to expected format
        keys = list(data.keys())

        # Filter out string data and keep only numeric arrays
        numeric_keys = []
        for key in keys:
            try:
                arr = data[key]
                if (
                    hasattr(arr, "dtype")
                    and np.issubdtype(arr.dtype, np.number)
                    and arr.ndim >= 1
                ):
                    numeric_keys.append(key)
                    print(f"Key '{key}': shape={arr.shape}, dtype={arr.dtype}")
            except Exception:
                print(f"Skipping key '{key}': not numeric")

        print(f"Numeric keys found: {numeric_keys}")

        # These variables were used for generic key mapping but are now unused
        # since we handle the specific W/bbox structure directly

        # Handle the specific structure we found: W(128,128,2), bbox(4,), lat0_rad
        if "W" in numeric_keys:
            # W contains both u and v components in shape (height, width, 2)
            W = data["W"]
            print(f"W shape: {W.shape}")
            u_data = W[:, :, 0]  # First component (u)
            v_data = W[:, :, 1]  # Second component (v)
        else:
            # Fallback to separate u,v arrays
            flow_arrays = [key for key in numeric_keys if data[key].ndim == 2]
            if len(flow_arrays) >= 2:
                u_data = data[flow_arrays[0]]
                v_data = data[flow_arrays[1]]
            else:
                u_data = np.zeros((128, 128), dtype=np.float32)
                v_data = np.zeros((128, 128), dtype=np.float32)

        # Handle bbox for coordinates
        if "bbox" in numeric_keys:
            bbox = data["bbox"]
            print(f"bbox: {bbox}")
            # bbox likely contains [min_x, min_y, max_x, max_y] or [min_lon, min_lat, max_lon, max_lat]
            x_data = np.linspace(bbox[0], bbox[2], u_data.shape[1], dtype=np.float32)
            y_data = np.linspace(bbox[1], bbox[3], u_data.shape[0], dtype=np.float32)
        else:
            # Default coordinate system
            x_data = np.linspace(0, 1000000, u_data.shape[1], dtype=np.float32)
            y_data = np.linspace(0, 1000000, u_data.shape[0], dtype=np.float32)
        # Handle lat0_rad
        if "lat0_rad" in data:
            lat0_rad = float(data["lat0_rad"])
        else:
            # Default lat0 for Tokyo area
            lat0_rad = math.radians(35.6762)

        print(
            f"Final data shapes - u: {u_data.shape}, v: {v_data.shape}, x: {x_data.shape}, y: {y_data.shape}"
        )
        print(f"lat0_rad: {lat0_rad}")

        return {
            "u": u_data,
            "v": v_data,
            "x": x_data,
            "y": y_data,
            "lat0_rad": lat0_rad,
        }

    def add_min_speed(self, Wpack, min_speed=0.02):
        """Add minimum speed to wind pack."""
        Wpack = Wpack.copy()

        # Ensure data is float32
        u = np.asarray(Wpack["u"], dtype=np.float32)
        v = np.asarray(Wpack["v"], dtype=np.float32)

        speed = np.sqrt(u**2 + v**2)
        mask = speed < min_speed

        if np.any(mask):
            # Add minimum speed in random direction
            angles = np.random.uniform(0, 2 * np.pi, size=mask.shape).astype(np.float32)
            Wpack["u"] = np.where(mask, min_speed * np.cos(angles), u)
            Wpack["v"] = np.where(mask, min_speed * np.sin(angles), v)
        else:
            Wpack["u"] = u
            Wpack["v"] = v

        return Wpack

    def sample_w(self, Wpack, x, y):
        """Sample wind velocity at position (x, y)."""
        # Find nearest grid point
        x_grid = np.asarray(Wpack["x"], dtype=np.float32)
        y_grid = np.asarray(Wpack["y"], dtype=np.float32)

        i = np.argmin(np.abs(x_grid - float(x)))
        j = np.argmin(np.abs(y_grid - float(y)))

        u = float(Wpack["u"][j, i])
        v = float(Wpack["v"][j, i])

        return np.array([u, v], dtype=np.float32)

    def open_land_mask(self, npz_path: str):
        """Load land mask from npz file."""
        data = np.load(npz_path)
        print(f"Land mask keys: {list(data.keys())}")

        # Find the mask data - could be under different key names
        mask_data = None
        x_data = None
        y_data = None

        for key in data.keys():
            try:
                arr = data[key]
                if hasattr(arr, "dtype") and np.issubdtype(arr.dtype, np.number):
                    print(
                        f"Land mask key '{key}': shape={arr.shape}, dtype={arr.dtype}"
                    )
                    if arr.ndim == 2:  # 2D mask data
                        mask_data = arr
                    elif arr.ndim == 1:  # 1D coordinate data
                        if x_data is None:
                            x_data = arr
                        elif y_data is None:
                            y_data = arr
            except Exception:
                pass

        # Default if not found
        if mask_data is None:
            mask_data = np.ones((128, 128), dtype=np.float32)
        if x_data is None:
            x_data = np.linspace(0, 1000000, mask_data.shape[1], dtype=np.float32)
        if y_data is None:
            y_data = np.linspace(0, 1000000, mask_data.shape[0], dtype=np.float32)

        return {
            "mask": np.asarray(mask_data, dtype=np.float32),
            "x": np.asarray(x_data, dtype=np.float32),
            "y": np.asarray(y_data, dtype=np.float32),
        }

    def open_passable_mask(self, npz_path: str):
        """Load passable mask from npz file."""
        # Same logic as land mask
        return self.open_land_mask(npz_path)

    def is_passable_xy(self, passpack, x, y):
        """Check if position (x, y) is passable."""
        x_grid = passpack["x"]
        y_grid = passpack["y"]

        i = np.argmin(np.abs(x_grid - x))
        j = np.argmin(np.abs(y_grid - y))

        return passpack["mask"][j, i] > 0

    def sample_random_land_xy(self, landpack, rng):
        """Sample random land position."""
        mask = landpack["mask"]
        land_indices = np.where(mask > 0)

        if len(land_indices[0]) == 0:
            # No land found, return origin
            return np.array([0.0, 0.0])

        idx = rng.integers(0, len(land_indices[0]))
        j, i = land_indices[0][idx], land_indices[1][idx]

        x = landpack["x"][i]
        y = landpack["y"][j]

        return np.array([x, y])
