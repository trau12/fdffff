// src/components/InfluxDBEmbed.js
import React from 'react';

const InfluxDBEmbed = () => {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}>
      <iframe
        src="http://localhost:8086" // URL của giao diện InfluxDB
        style={{ width: "100%", height: "100%", border: "none" }}
        title="InfluxDB Web"
      ></iframe>
    </div>
  );
};

export default InfluxDBEmbed;
