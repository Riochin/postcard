import json
import boto3
import logging
import os
import time
from datetime import datetime, timezone
from typing import Dict, Any
from decimal import Decimal
from location_calculate_minimal import MovingLettersAlgorithm
import numpy as np


# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("DYNAMODB_TABLE_NAME", "postcard-dev-dynamodb")
table = dynamodb.Table(table_name)


def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    # loop until 5 minutes have passed, running every 5 seconds

    start_time = time.time()
    duration_seconds = 5 * 60  # 5 minutes
    interval_seconds = 5
    execution_count = 0
    results = []

    logger.info("Starting 5-minute simulation with 5-second intervals")

    while time.time() - start_time < duration_seconds:
        execution_start = time.time()

        # Run one iteration
        result = lambda_handler_runner(event, context)
        results.append(result)
        execution_count += 1

        logger.info(
            f"Completed execution {execution_count}, elapsed: {time.time() - start_time:.1f}s"
        )

        # Calculate remaining time and sleep if needed
        elapsed = time.time() - execution_start
        remaining_total_time = duration_seconds - (time.time() - start_time)
        sleep_time = min(interval_seconds - elapsed, remaining_total_time)

        if sleep_time > 0:
            time.sleep(sleep_time)

    logger.info(
        f"Simulation completed after {execution_count} executions in {time.time() - start_time:.1f}s"
    )

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "total_executions": execution_count,
                "duration_seconds": time.time() - start_time,
                "final_updated_count": results[-1]["body"]["updated_count"]
                if results and results[-1]["statusCode"] == 200
                else 0,
                "total_postcards_updated": sum(
                    r["body"]["updated_count"]
                    for r in results
                    if r["statusCode"] == 200
                ),
            },
            ensure_ascii=False,
        ),
    }


def lambda_handler_runner(event: Dict[str, Any], context) -> Dict[str, Any]:
    try:
        # ==== Parameters ====
        sub_steps = int(event.get("sub_steps", 20))
        dt_step = float(event.get("dt_step", 0.2))
        speed_gain = float(event.get("speed_gain", 30000.0))  # 10x stronger movement
        seed = int(event.get("seed", 42))

        rng = np.random.default_rng(seed)

        # ==== Scan all postcards from DynamoDB ====
        traveling_postcards = []

        try:
            # Scan for all POSTCARD items with METADATA sort key and traveling status
            response = table.scan(
                FilterExpression="begins_with(PK, :pk_prefix) AND SK = :sk AND #status = :status",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":pk_prefix": "POSTCARD#",
                    ":sk": "METADATA",
                    ":status": "traveling",
                },
            )

            for item in response.get("Items", []):
                if item.get("current_lat") and item.get("current_lon"):
                    # Handle both string and Decimal types from DynamoDB
                    try:
                        current_lat = float(str(item["current_lat"]))
                        current_lon = float(str(item["current_lon"]))

                        traveling_postcards.append(
                            {
                                "PK": item["PK"],
                                "SK": item["SK"],
                                "postcard_id": item.get("postcard_id"),
                                "current_lat": current_lat,
                                "current_lon": current_lon,
                            }
                        )
                    except (ValueError, TypeError) as e:
                        logger.warning(
                            f"Invalid coordinates for postcard {item.get('postcard_id', 'unknown')}: "
                            f"lat={item.get('current_lat')}, lon={item.get('current_lon')}, error: {str(e)}"
                        )

            logger.info(f"Found {len(traveling_postcards)} traveling postcards")

            if not traveling_postcards:
                logger.info("No traveling postcards found")
                return {
                    "statusCode": 200,
                    "body": {"message": "No traveling postcards to update"},
                }

        except Exception as db_error:
            logger.error(f"Error scanning DynamoDB: {str(db_error)}")
            return {
                "statusCode": 500,
                "body": {"error": f"Database scan failed: {str(db_error)}"},
            }

        # ==== Initialize simulation components ====
        alg = MovingLettersAlgorithm()
        base_dir = os.path.dirname(__file__)

        # Load wind data
        wind_npz = os.path.join(
            base_dir,
            "wind_strength_maps",
            "wind_map_flow_strength_total_20250914_011023.npz",
        )
        Wpack = alg.load_wpack_from_npz(wind_npz)
        Wpack = alg.add_min_speed(Wpack, min_speed=0.02)
        lat0 = Wpack["lat0_rad"]

        # Load land masks
        landpack = alg.open_land_mask(
            os.path.join(
                base_dir,
                "land_mask_cache",
                "land_mask_11455211.58_13061507.21_2914674.78_5040533.85_128.npz",
            )
        )
        passpack = alg.open_passable_mask(
            os.path.join(
                base_dir,
                "land_mask_cache",
                "passable_mask_11455211.58_13061507.21_2914674.78_5040533.85_128_76ae0ce3.npz",
            )
        )

        # ==== Process all traveling postcards ====
        updated_postcards = []

        for postcard in traveling_postcards:
            try:
                # Convert lat/lon to meter coordinates
                current_lat = postcard["current_lat"]
                current_lon = postcard["current_lon"]
                x, y = alg.latlon_to_xy(current_lat, current_lon, lat0)
                p = np.array([x, y], dtype=np.float32)

                # Run wind simulation (move position)
                for _ in range(sub_steps):
                    # Sample wind velocity at current position
                    v = alg.sample_w(Wpack, p[0], p[1]).astype(np.float32) * speed_gain
                    p_prop = p + v * dt_step

                    # Check if new position is passable
                    if alg.is_passable_xy(
                        passpack, p[0], p[1]
                    ) and not alg.is_passable_xy(passpack, p_prop[0], p_prop[1]):
                        # If hitting boundary, teleport to random land position
                        p = alg.sample_random_land_xy(landpack, rng)
                    else:
                        # Move to new position
                        p = p_prop

                # Convert back to lat/lon
                new_lon, new_lat = alg.m_to_lonlat(p[0], p[1], lat0)

                # Update this postcard in DynamoDB (convert to Decimal for DynamoDB)
                table.update_item(
                    Key={"PK": postcard["PK"], "SK": postcard["SK"]},
                    UpdateExpression="SET current_lat = :lat, current_lon = :lon, updated_at = :timestamp",
                    ExpressionAttributeValues={
                        ":lat": Decimal(str(float(new_lat))),
                        ":lon": Decimal(str(float(new_lon))),
                        ":timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )

                updated_postcards.append(
                    {
                        "postcard_id": postcard["postcard_id"],
                        "old_lat": current_lat,
                        "old_lon": current_lon,
                        "new_lat": float(new_lat),
                        "new_lon": float(new_lon),
                    }
                )

                logger.info(
                    f"Updated postcard {postcard['postcard_id']}: "
                    f"({current_lat:.6f}, {current_lon:.6f}) -> ({new_lat:.6f}, {new_lon:.6f})"
                )

            except Exception as postcard_error:
                logger.error(
                    f"Error updating postcard {postcard.get('postcard_id', 'unknown')}: {str(postcard_error)}"
                )

        return {
            "statusCode": 200,
            "body": {
                "updated_count": len(updated_postcards),
                "postcards": updated_postcards,
                "meta": {
                    "sub_steps": sub_steps,
                    "dt_step": dt_step,
                    "speed_gain": speed_gain,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            },
        }

    except Exception as e:
        logger.error(f"Lambda function error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()}
            ),
        }
