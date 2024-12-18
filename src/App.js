
import { useState, useEffect } from 'react';
import { LineChart, XAxis, YAxis, CartesianGrid, Line, Tooltip, Legend } from 'recharts';
import { BarChart, Bar } from 'recharts';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { MessageType } from './types';

const ROOM = "q";
const SOCKET_URL = 'http://localhost:8080/chat';

export default function SmartGardenDashboard() {
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

    useEffect(() => {
        const stompClient = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            onConnect: () => {
                console.log('Connected to STOMP');
                stompClient.subscribe(`/topic/messages/${ROOM}`, (message) => {
                    const data = JSON.parse(message.body);
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

    const handleDeviceControl = (device, state) => {
        if (!client) return;

        const controlMessage = {
            username: "user",
            message: {
                device,
                state
            },
            messageType: MessageType.CONTROL,
            created: new Date().toISOString()
        };

        client.publish({
            destination: `/app/chat/${ROOM}`,
            body: JSON.stringify(controlMessage)
        });
    };

    return (
        <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sensor Cards */}
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Nhiệt độ</h3>
                    <p className="text-3xl">{sensorData.sensors.nhietdo}°C</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Độ ẩm không khí</h3>
                    <p className="text-3xl">{sensorData.sensors.doam}%</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Độ ẩm đất</h3>
                    <p className="text-3xl">{sensorData.sensors.doamdat}%</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Ánh sáng</h3>
                    <p className="text-3xl">{sensorData.sensors.cbanhsang} lux</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">CO2</h3>
                    <p className="text-3xl">{sensorData.sensors.ppm} ppm</p>
                </div>
            </div>

            {/* Device Controls */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                <button
                    onClick={() => handleDeviceControl('pump', !sensorData.devices.dkbom)}
                    className={`p-4 rounded-lg ${sensorData.devices.dkbom ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                    Máy bơm {sensorData.devices.dkbom ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={() => handleDeviceControl('light', !sensorData.devices.dkden)}
                    className={`p-4 rounded-lg ${sensorData.devices.dkden ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                    Đèn {sensorData.devices.dkden ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={() => handleDeviceControl('exhaust_fan', !sensorData.devices.dkquathut)}
                    className={`p-4 rounded-lg ${sensorData.devices.dkquathut ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                    Quạt hút {sensorData.devices.dkquathut ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={() => handleDeviceControl('intake_fan', !sensorData.devices.dkquatthoi)}
                    className={`p-4 rounded-lg ${sensorData.devices.dkquatthoi ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                    Quạt thổi {sensorData.devices.dkquatthoi ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={() => handleDeviceControl('curtain', !sensorData.devices.dkluoiche)}
                    className={`p-4 rounded-lg ${sensorData.devices.dkluoiche ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                    Lưới che {sensorData.devices.dkluoiche ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={() => handleDeviceControl('cooler', !sensorData.devices.dksolanh)}
                    className={`p-4 rounded-lg ${sensorData.devices.dksolanh ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                    Sò lạnh {sensorData.devices.dksolanh ? 'ON' : 'OFF'}
                </button>
            </div>
        </div>
    );
}