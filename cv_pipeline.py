import cv2
import time
import requests
import os
import numpy as np
from ultralytics import YOLO

# ---------------------------------------------------------
# WANKHEDE DIGITAL TWIN - REAL-TIME CCTV VISION PIPELINE
# ---------------------------------------------------------

# Configuration
CCTV_URL = "0"  # Can be an RTSP stream: "rtsp://username:password@camera_ip:554/stream"
SERVER_URL = os.getenv("STADIANAV_SERVER_URL", "http://localhost:3002/api/cv/upload-frame")
MODEL_PATH = "yolov8n.pt"  # Pre-trained Nano YOLOv8 model for maximum FPS

# Wait time simulation constants
SECS_PER_PERSON = 45  # Estimating 45 seconds to serve 1 person

# Define Regions of Interest (ROI) mapping to specific sections/stalls
# Format: "stall_id": [(x1,y1), (x2, y2)] (Bounding boxes in pixel space of the CCTV feed)
STALL_ROIS = {
    "fs-1": [(100, 150), (400, 450)],  # Wow! Momo Counter
    "fs-2": [(500, 200), (800, 500)],  # Punjab Grill Counter
    "fs-3": [(200, 100), (500, 400)],  # Blue Tokai Counter
    "fs-4": [(600, 300), (900, 600)],  # Subway Counter
}

# 3D Mapping factors (Translating 2D Pixel space to Stadium 3D Map coordinates)
# (In a real scenario, this uses Homography projection)
def map_to_3d(px, py):
    # Simplified mock mapping function
    x3d = (px / 1000.0) * 100 - 50
    z3d = (py / 1000.0) * 100 - 50
    return {"x": round(x3d, 2), "z": round(z3d, 2), "intensity": 0.8}

def main():
    print(f"[STATUS] Loading YOLO Model ({MODEL_PATH})...")
    model = YOLO(MODEL_PATH)
    
    print(f"[STATUS] Connecting to CCTV Stream: {CCTV_URL}")
    cap = cv2.VideoCapture(int(CCTV_URL) if CCTV_URL.isdigit() else CCTV_URL)
    
    if not cap.isOpened():
        print("[ERROR] Failed to open video stream.")
        return

    print("[STATUS] Vision Engine Operational. Monitoring Crows...")

    frame_skip = 5  # Process every 5th frame to save CPU
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Stream disconnected. Reconnecting...")
            time.sleep(2)
            cap = cv2.VideoCapture(int(CCTV_URL) if CCTV_URL.isdigit() else CCTV_URL)
            continue
            
        frame_count += 1
        if frame_count % frame_skip != 0:
            continue

        # Inference: Detect objects in the frame
        results = model(frame, classes=[0], verbose=False) # class 0 is 'person'
        
        boxes = results[0].boxes
        
        density_data = []
        queue_counts = {k: 0 for k in STALL_ROIS.keys()}

        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2) # Center point of the person
            
            # Map person to 3D Map density clusters
            mapped_coord = map_to_3d(cx, cy)
            density_data.append(mapped_coord)

            # Check if person is inside a specific Stall ROI to calculate Wait Times
            for stall_id, (pt1, pt2) = STALL_ROIS.items():
                if pt1[0] <= cx <= pt2[0] and pt1[1] <= cy <= pt2[1]:
                    queue_counts[stall_id] += 1

            # Draw bounding box on frame for debug window
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 255), 2)
            cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)

        # Calculate Queue Wait Times
        wait_times_payload = {
            stall_id: {"queue_length": count, "wait_time_mins": round((count * SECS_PER_PERSON) / 60, 1)}
            for stall_id, count in queue_counts.items()
        }

        # Transmit Density and Wait Time Data to Next.js Backend
        payload = {
            "cameraId": "wankhede_cam_01",
            "simulatedData": density_data,
            "waitTimes": wait_times_payload
        }

        try:
            requests.post(SERVER_URL, json=payload, timeout=2)
            print(f"[SYNC] Uploaded {len(density_data)} people | Wait Times: {wait_times_payload}")
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Sync Failed: {e}")

        # Draw ROI zones for Debug View
        for stall_id, (pt1, pt2) in STALL_ROIS.items():
            cv2.rectangle(frame, pt1, pt2, (255, 0, 0), 3)
            wait_t = wait_times_payload[stall_id]["wait_time_mins"]
            cv2.putText(frame, f"{stall_id}: {wait_t} min", (pt1[0], pt1[1] - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Show Live Debug Render
        cv2.imshow("Wankhede CV Engine - Debug Feed", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()
