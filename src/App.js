// src/App.js
import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { MessageType } from './types';
import InfluxDBEmbed from './components/InfluxDBEmbed';

const ROOM = "q";
const SOCKET_URL = 'http://192.168.1.18:8080/chat';

export default function SmartGardenDashboard() {
    const [manualMode, setManualMode] = useState(true); // Chế độ mặc định là chỉnh tay
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

    const [showInflux, setShowInflux] = useState(false); // Trạng thái để chuyển đổi giữa Dashboard và InfluxDBEmbed

    useEffect(() => {
        const stompClient = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            onConnect: () => {
                console.log('Connected to STOMP');
                stompClient.subscribe(`/topic/messages/${ROOM}`, (message) => {
                    const data = JSON.parse(message.body);
                    console.log('Received message:', data);
                    if (data.messageType === MessageType.SENSOR) {
                        setSensorData(data.message);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
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
            message: { isManualMode: isManual }, // Cập nhật ở đây
            messageType: "CONTROL",
            created: new Date().toISOString(),
        };
        client.publish({
            destination: `/app/chat/${ROOM}`,
            body: JSON.stringify(modeMessage),
        });
    };

    const handleDeviceControl = (device, state) => {
        if (!manualMode || !client) return;

        const controlMessage = {
            username: "user",
            message: {
                [device]: state,
            },
            messageType: "CONTROL",
            created: new Date().toISOString(),
        };

        client.publish({
            destination: `/app/chat/${ROOM}`,
            body: JSON.stringify(controlMessage),
        });
    };

    return (
        <div className={`min-h-screen p-4 ${showInflux ? 'overflow-hidden' : 'bg-gradient-to-br from-blue-50 to-green-50'} md:p-6`}>
            <div className="mx-auto space-y-6 max-w-7xl">
                <h1 className="mb-6 text-2xl font-bold text-center text-gray-800 md:text-3xl">
                    Bảng Điều Khiển Vườn Thông Minh
                </h1>

                {showInflux ? (
                    // Hiển thị giao diện nhúng InfluxDB
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000 }}>
                        <button
                            onClick={() => setShowInflux(false)}
                            className="absolute top-4 left-4 p-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                            style={{ zIndex: 1001 }}
                        >
                            Quay Lại Dashboard
                        </button>
                        <InfluxDBEmbed />
                    </div>
                ) : (
                    // Hiển thị giao diện chính của Dashboard
                    <>
                        {/* Nút Chỉnh Tay và Tự Động */}
                        <div className="mb-4 flex justify-center gap-4">
                            <button
                                onClick={() => handleModeChange('manual')}
                                className={`p-2 rounded-lg ${manualMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                Chỉnh Tay
                            </button>
                            <button
                                onClick={() => handleModeChange('auto')}
                                className={`p-2 rounded-lg ${!manualMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                Tự Động
                            </button>
                        </div>

                        {/* Sensor Cards */}
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            {Object.entries(sensorData.sensors).map(([key, value]) => (
                                <div key={key} className="p-4 transition-transform bg-white shadow-md rounded-2xl hover:scale-105">
                                    <div className="flex flex-col items-center">
                                        <span className="mb-2 text-4xl">🌡️</span>
                                        <p className="text-sm text-gray-600">{key}</p>
                                        <p className="mt-1 text-2xl font-bold text-blue-600">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Device Controls */}
                        {manualMode && (
                            <div className="p-6 bg-white shadow-md rounded-2xl">
                                <h2 className="mb-4 text-xl font-semibold text-gray-800">Điều Khiển Thiết Bị</h2>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                    {Object.entries(sensorData.devices).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleDeviceControl(key, !value)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all 
                                                ${value ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            <span className="mb-2 text-2xl">🔧</span>
                                            <span className="text-sm font-medium">{key}</span>
                                            <span className="mt-1 text-xs">{value ? 'BẬT' : 'TẮT'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Nút chuyển sang InfluxDB */}
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setShowInflux(true)}
                                className="p-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                            >
                                Xem Biểu Đồ Từ InfluxDB
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
