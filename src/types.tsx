
export interface SensorData {
    sensors: {
        nhietdo: number;
        doam: number;
        doamdat: number;
        cbanhsang: number;
        ppm: number;
    };
    devices: {
        dkbom: boolean;
        dkden: boolean;
        dkquathut: boolean;
        dkquatthoi: boolean;
        dkluoiche: boolean;
        dksolanh: boolean;
    };
}

export interface Message<T = any> {
    message: T;
    username: string;
    created: string;
    messageType: MessageType;
}

export enum MessageType {
    SYSTEM = 'SYSTEM',
    USER = 'USER',
    ADMIN = 'ADMIN',
    INFO = 'INFO',
    TYPING = 'TYPING',
    FINISHED = 'FINISHED',
    INPUT = 'INPUT',
    SENSOR = 'SENSOR',
    DEBUG = 'DEBUG',
    CONTROL = 'CONTROL'
}

export interface ControlMessage {
    device: string;
    state: boolean;
}

