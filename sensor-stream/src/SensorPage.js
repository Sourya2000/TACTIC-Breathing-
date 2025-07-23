import React, { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// Manual download for selected device
function downloadCSV(data, filename = "sensor_data.csv") {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(header => JSON.stringify(row[header] ?? "")).join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function Chart({ data, keys }) {
  const colors = ["#8884d8", "#82ca9d", "#ff7300"];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="elapsedTime"
          tickFormatter={(ms) => `${(ms / 1000).toFixed(1)}s`}
          label={{ value: "Time (s)", position: "insideBottomRight", offset: -5 }}
        />
        <YAxis />
        <Tooltip
          formatter={(value, name) => [value.toFixed(2), name]}
          labelFormatter={(ms) => `Time: ${(ms / 1000).toFixed(2)} s`}
        />
        <Legend />
        {keys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i % colors.length]}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

const SensorPage = () => {
  const [allData, setAllData] = useState({});
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [latest, setLatest] = useState(null);
  const [syncStartTime, setSyncStartTime] = useState(null);
  const downloadTracker = useRef({});

  const MAX_POINTS = 10;

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.4.4:8000/ws");

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      ws.send(JSON.stringify({ deviceId: "viewer" }));
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const now = Date.now();

        if (!parsed.accel || !parsed.gyro || !parsed.mag) return;

        if (!syncStartTime) {
          setSyncStartTime(now);
        }

        const elapsedTime = now - syncStartTime;
        const deviceId = parsed.deviceId || "unknown";

        const newEntry = {
          elapsedTime,
          timestamp: now,
          accelX: parsed.accel[0],
          accelY: parsed.accel[1],
          accelZ: parsed.accel[2],
          gyroX: parsed.gyro[0],
          gyroY: parsed.gyro[1],
          gyroZ: parsed.gyro[2],
          magX: parsed.mag[0],
          magY: parsed.mag[1],
          magZ: parsed.mag[2],
        };

        setAllData(prev => {
          const oldData = prev[deviceId] || [];
          const newData = [...oldData, newEntry];

          if (newData.length === 10 && !downloadTracker.current[deviceId]) {
            const filename = `device_${deviceId}_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
            downloadCSV(newData, filename);
            downloadTracker.current[deviceId] = true;
          }

          return {
            ...prev,
            [deviceId]: newData,
          };
        });

        if (!selectedDevice) {
          setSelectedDevice(deviceId);
        }

        if (deviceId === selectedDevice) {
          setLatest(newEntry);
        }

      } catch (e) {
        console.error("❌ WebSocket parse error:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("❌ WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [selectedDevice, syncStartTime]);

  const currentData = (allData[selectedDevice] || []).slice(-MAX_POINTS);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "30%", padding: "20px", borderRight: "1px solid #ccc", overflowY: "auto" }}>
        <h1>ESP32 Sensor Stream</h1>

        <label>
          <strong>Select Device:</strong>
          <select
            value={selectedDevice || ""}
            onChange={(e) => setSelectedDevice(e.target.value)}
            style={{ width: "100%", marginTop: "10px", padding: "5px" }}
          >
            {Object.keys(allData).map((deviceId) => (
              <option key={deviceId} value={deviceId}>
                {deviceId}
              </option>
            ))}
          </select>
        </label>

        {latest ? (
          <>
            <h2>Acceleration</h2>
            <p><strong>X:</strong> {latest.accelX}</p>
            <p><strong>Y:</strong> {latest.accelY}</p>
            <p><strong>Z:</strong> {latest.accelZ}</p>

            <h2>Gyroscope</h2>
            <p><strong>X:</strong> {latest.gyroX}</p>
            <p><strong>Y:</strong> {latest.gyroY}</p>
            <p><strong>Z:</strong> {latest.gyroZ}</p>

            <h2>Magnetometer</h2>
            <p><strong>X:</strong> {latest.magX}</p>
            <p><strong>Y:</strong> {latest.magY}</p>
            <p><strong>Z:</strong> {latest.magZ}</p>

            <p><strong>Elapsed Time:</strong> {(latest.elapsedTime / 1000).toFixed(2)} s</p>
            <p><em>Device: {selectedDevice}</em></p>
          </>
        ) : (
          <p>Waiting for sensor data...</p>
        )}

        <button
          onClick={() => downloadCSV(allData[selectedDevice] || [])}
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Download CSV
        </button>
      </div>

      <div style={{ width: "70%", padding: "20px", overflowY: "auto" }}>
        {currentData.length > 0 ? (
          <>
            <h2>Acceleration Chart</h2>
            <Chart data={currentData} keys={["accelX", "accelY", "accelZ"]} />
            <h2>Gyroscope Chart</h2>
            <Chart data={currentData} keys={["gyroX", "gyroY", "gyroZ"]} />
            <h2>Magnetometer Chart</h2>
            <Chart data={currentData} keys={["magX", "magY", "magZ"]} />
          </>
        ) : (
          <p>No chart data for selected device</p>
        )}
      </div>
    </div>
  );
};

export default SensorPage;
