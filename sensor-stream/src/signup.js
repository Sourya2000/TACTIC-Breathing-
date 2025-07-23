import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    patientId: "",
    gender: "",
    age: "",
  });

  const [errors, setErrors] = useState({});
  const [sensorStatus, setSensorStatus] = useState("");

  // Validate form data types and required fields
  const validate = () => {
    const newErrors = {};

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.patientId || isNaN(formData.patientId)) {
      newErrors.patientId = "Patient ID must be a number.";
    }

    if (!formData.gender || !["Male", "Female", "Other"].includes(formData.gender)) {
      newErrors.gender = "Please select a valid gender.";
    }

    if (!formData.age || isNaN(formData.age) || Number(formData.age) <= 0) {
      newErrors.age = "Age must be a positive number.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // valid if no errors
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = () => {
    if (!validate()) {
      return;
    }

    // Save user info in localStorage as JSON string
    localStorage.setItem("userInfo", JSON.stringify(formData));
    alert("✅ User registered!");
  };

  // WebSocket sensor check with deviceId (same as before)
  const checkConnection = async (deviceId) => {
    try {
      const ws = new WebSocket("ws://192.168.4.4:8000/ws");

      ws.onopen = () => {
        ws.send(JSON.stringify({ deviceId }));
        setSensorStatus(`✅ ${deviceId} is connected to server.`);
        ws.close();
      };

      ws.onerror = () => {
        setSensorStatus(`❌ ${deviceId} is not connected.`);
      };
    } catch (err) {
      setSensorStatus(`❌ Error checking ${deviceId} connection.`);
    }
  };

  return (
    <div style={{
      padding: "30px",
      fontFamily: "Arial",
      backgroundColor: "#f2f8ff",
      borderRadius: "10px",
      width: "350px",
      margin: "30px auto",
      boxShadow: "0px 0px 10px rgba(0,0,0,0.1)"
    }}>
       <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
        🩺 Patient Signup
      </h2>

      <input
        type="text"
        name="username"
        placeholder="Username"
        onChange={handleInputChange}
        value={formData.username}
        style={{ width: "100%", margin: "8px 0", padding: "8px" }}
      />
      {errors.username && <p style={{color:"red", margin:"5px 0"}}>{errors.username}</p>}

      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleInputChange}
        value={formData.password}
        style={{ width: "100%", margin: "8px 0", padding: "8px" }}
      />
      {errors.password && <p style={{color:"red", margin:"5px 0"}}>{errors.password}</p>}

      <input
        type="number"
        name="patientId"
        placeholder="Patient ID"
        onChange={handleInputChange}
        value={formData.patientId}
        style={{ width: "100%", margin: "8px 0", padding: "8px" }}
      />
      {errors.patientId && <p style={{color:"red", margin:"5px 0"}}>{errors.patientId}</p>}

      <select
        name="gender"
        value={formData.gender}
        onChange={handleInputChange}
        style={{ width: "100%", margin: "8px 0", padding: "8px" }}
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      {errors.gender && <p style={{color:"red", margin:"5px 0"}}>{errors.gender}</p>}

      <input
        type="number"
        name="age"
        placeholder="Age"
        onChange={handleInputChange}
        value={formData.age}
        style={{ width: "100%", margin: "8px 0", padding: "8px" }}
      />
      {errors.age && <p style={{color:"red", margin:"5px 0"}}>{errors.age}</p>}

      <button
        onClick={handleSignup}
        style={{
          backgroundColor: "#007bff",
          color: "#fff",
          padding: "10px",
          width: "100%",
          marginTop: "10px",
          border: "none",
          borderRadius: "4px"
        }}
      >
        Register User
      </button>

      <hr style={{ margin: "20px 0" }} />

      <button
        onClick={() => checkConnection("ESP1")}
        style={{ backgroundColor: "#28a745", color: "#fff", padding: "8px", width: "100%", marginBottom: "10px" }}
      >
        Check Sensor1 (ESP1) Connection
      </button>

      <button
        onClick={() => checkConnection("ESP2")}
        style={{ backgroundColor: "#17a2b8", color: "#fff", padding: "8px", width: "100%" }}
      >
        Check Sensor2 (ESP2) Connection
      </button>

      {sensorStatus && <p style={{ marginTop: "10px", color: "#555" }}>{sensorStatus}</p>}

      <button
        onClick={() => navigate("/main")}
        style={{ marginTop: "20px", width: "100%", padding: "8px", backgroundColor: "#ffc107", border: "none" }}
      >
        Go to Main Sensor Page
      </button>
    </div>
  );
};

export default Signup;
