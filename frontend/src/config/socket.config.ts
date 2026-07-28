import { io } from 'socket.io-client';

// Connect to the same origin (goes through Vite proxy in development)
// This avoids mixed content issues when frontend is served via HTTPS
export const socket = io({
    autoConnect: true,
    path: '/socket.io',
});
