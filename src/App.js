import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { MessageType } from './types';
import InfluxDBEmbed from './components/InfluxDBEmbed';
import { motion, AnimatePresence } from 'framer-motion';

const ROOM = "q";
const SOCKET_URL = 'http://192.168.1.6:8080/chat';

// Emoji mappings for sensors
const SENSOR_ICONS = {
  nhietdo: '🌡️',
  doam: '💧',
  doamdat: '🌱',
  cbanhsang: '☀️',
  ppm: '🔬'
};

// Emoji mappings for devices
const DEVICE_ICONS = {
  dkbom: '💧',
  dkden: '💡',
  dkquathut: '🌪️',
  dkquatthoi: '💨',
  dkluoiche: '🌿',
  dksolanh: '❄️'
};

export default function SmartGardenDashboard() {
  const [manualMode, setManualMode] = useState(true);
  const [client, setClient] = useState(null);
  const [sensorData, setSensorData] = useState({
    sensors: {
      nhietdo: 0,
      doam: 0,
      doamdat: 0,
      cbanhsang: 0,
      ppm: 0
    },
    devices: {
      dkbom: false,
      dkden: false,
      dkquathut: false,
      dkquatthoi: false,
      dkluoiche: false,
      dksolanh: false
    }
  });
  const [showInflux, setShowInflux] = useState(false);

  // WebSocket setup
  useEffect(() => {
    const stompClient = new Client({
        webSocketFactory: () => new SockJS(SOCKET_URL),
        reconnectDelay: 5000, // Kết nối lại sau 5 giây nếu bị ngắt
        onConnect: () => {
          stompClient.subscribe(`/topic/messages/${ROOM}`, (message) => {
            try {
                const data = JSON.parse(message.body);
                console.log('Received message:', data);
        
                if (data.messageType === MessageType.SENSOR || data.messageType === MessageType.CONTROL) {
                    if (data.message && typeof data.message === 'object') {
                        setSensorData((prev) => ({
                            ...prev,
                            ...data.message,
                        }));
                    } else {
                        console.error("Invalid message structure:", data);
                    }
                } else {
                    console.warn("Unhandled message type:", data.messageType);
                }
            } catch (error) {
                console.error("Error parsing message:", error);
            }
          });
        },
        onStompError: (frame) => {
            console.error('STOMP error:', frame.headers['message']);
            console.error('Details:', frame.body);
        },
        onDisconnect: () => {
            console.warn("STOMP client disconnected.");
        }
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
        if (stompClient) {
            stompClient.deactivate();
        }
    };
  }, []);


  const handleModeChange = (mode) => {
    const isManual = mode === 'manual';
    setManualMode(isManual);

    const modeMessage = {
        username: "user",
        message: { isManualMode: isManual },
        messageType: "CONTROL",
        created: new Date().toISOString(),
    };

    if (!client || !client.connected) {
        console.error("STOMP client is not connected.");
        return;
    }

    try {
        client.publish({
            destination: `/app/chat/${ROOM}`,
            body: JSON.stringify(modeMessage),
        });
        console.log(`Switched to ${isManual ? "manual" : "auto"} mode.`);
    } catch (error) {
        console.error("Error sending mode change message:", error);
    }
  };

  const handleDeviceControl = (device, state) => {
    if (!manualMode) {
        console.warn("Cannot control devices in auto mode.");
        return;
    }

    if (!client || !client.connected) {
        console.error("STOMP client is not connected.");
        return;
    }

    const controlMessage = {
        username: "user",
        message: {
            [device]: state,
        },
        messageType: "CONTROL",
        created: new Date().toISOString(),
    };

    try {
        client.publish({
            destination: `/app/chat/${ROOM}`,
            body: JSON.stringify(controlMessage),
        });
        console.log("Message sent:", controlMessage);
    } catch (error) {
        console.error("Error sending control message:", error);
    }
  };


  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {showInflux ? (
          <motion.div 
            key="influx"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white"
          >
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white shadow-md">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInflux(false)}
                className="px-6 py-3 text-white transition-all duration-300 bg-blue-500 rounded-lg shadow-md hover:bg-blue-600"
              >
                Quay Lại Dashboard
              </motion.button>
              <h2 className="text-xl font-semibold">Biểu Đồ InfluxDB</h2>
            </div>
            <div className="h-full pt-20">
              <InfluxDBEmbed />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-green-50 md:p-6"
          >
            <div className="mx-auto space-y-6 max-w-7xl">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-2xl font-bold text-center text-gray-800 md:text-3xl"
              >
                Bảng Điều Khiển Vườn Thông Minh
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-4 mb-4"
              >
                {['manual', 'auto'].map((mode) => (
                  <motion.button
                    key={mode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleModeChange(mode)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md
                      ${(mode === 'manual' ? manualMode : !manualMode)
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    {mode === 'manual' ? 'Chỉnh Tay' : 'Tự Động'}
                  </motion.button>
                ))}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
              >
                {Object.entries(sensorData.sensors).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                    className="p-6 bg-white shadow-lg rounded-2xl backdrop-blur-sm bg-opacity-90"
                  >
                    <div className="flex flex-col items-center">
                      <span className="mb-3 text-4xl animate-bounce">{SENSOR_ICONS[key]}</span>
                      <p className="text-sm font-medium text-gray-600">{key}</p>
                      <p className="mt-2 text-2xl font-bold text-blue-600">{value}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {manualMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white shadow-lg rounded-2xl backdrop-blur-sm bg-opacity-90"
                >
                  <h2 className="mb-6 text-xl font-semibold text-gray-800">Điều Khiển Thiết Bị</h2>
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
                    {Object.entries(sensorData.devices).map(([key, value], index) => (
                      <motion.button
                        key={key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeviceControl(key, !value)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300
                          ${value 
                            ? 'bg-green-500 text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        <span className="mb-2 text-3xl">{DEVICE_ICONS[key]}</span>
                        <span className="text-sm font-medium">{key}</span>
                        <span className="mt-2 text-xs font-bold">{value ? 'BẬT' : 'TẮT'}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowInflux(true)}
                  className="px-6 py-3 text-white transition-all duration-300 bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600"
                >
                  Xem Biểu Đồ Từ InfluxDB
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
