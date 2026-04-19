import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://restaurant-billing-ls80.onrender.com';

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Connect manually when needed
  withCredentials: true,
});
