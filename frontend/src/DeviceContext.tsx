import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DeviceMode = 'phone' | 'laptop' | 'tv' | null;

interface DeviceContextType {
    device: DeviceMode;
    setDevice: (device: DeviceMode) => void;
    clearDevice: () => void;
}

const DeviceContext = createContext<DeviceContextType>({
    device: null,
    setDevice: () => {},
    clearDevice: () => {},
});

export function DeviceProvider({ children }: { children: ReactNode }) {
    const [device, setDeviceState] = useState<DeviceMode>(() => {
        const stored = localStorage.getItem('streamx_device');
        return (stored as DeviceMode) || null;
    });

    const setDevice = (mode: DeviceMode) => {
        setDeviceState(mode);
        if (mode) {
            localStorage.setItem('streamx_device', mode);
        }
    };

    const clearDevice = () => {
        setDeviceState(null);
        localStorage.removeItem('streamx_device');
    };

    return (
        <DeviceContext.Provider value={{ device, setDevice, clearDevice }}>
            {children}
        </DeviceContext.Provider>
    );
}

export const useDevice = () => useContext(DeviceContext);
