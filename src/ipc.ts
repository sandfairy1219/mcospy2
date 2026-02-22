// IPC abstraction layer - replaces Electron's ipcRenderer with WebSocket communication
// Frontend (Tauri WebView) <--WebSocket--> Sidecar (Node.js)

let ws: WebSocket | null = null;
let connected = false;
let pendingRequests: Map<number, { resolve: (v: any) => void; reject: (e: any) => void }> = new Map();
let eventListeners: Map<string, Set<(data: any) => void>> = new Map();
let reqId = 0;
let connectPromise: Promise<void> | null = null;
let messageQueue: string[] = [];

export function connect(port: number): Promise<void> {
    if (connectPromise) return connectPromise;
    connectPromise = new Promise((resolve, reject) => {
        ws = new WebSocket(`ws://localhost:${port}`);
        ws.onopen = () => {
            connected = true;
            // flush queued messages
            for (const msg of messageQueue) {
                ws!.send(msg);
            }
            messageQueue = [];
            resolve();
        };
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'response' && msg.id !== undefined) {
                    const pending = pendingRequests.get(msg.id);
                    if (pending) {
                        pendingRequests.delete(msg.id);
                        if (msg.error) pending.reject(new Error(msg.error));
                        else pending.resolve(msg.data);
                    }
                } else if (msg.type === 'event') {
                    const listeners = eventListeners.get(msg.channel);
                    if (listeners) {
                        for (const handler of listeners) {
                            handler(msg.data);
                        }
                    }
                }
            } catch (e) {
                console.error('IPC message parse error:', e);
            }
        };
        ws.onclose = () => {
            connected = false;
            connectPromise = null;
            // Reject all pending requests
            for (const [, pending] of pendingRequests) {
                pending.reject(new Error('WebSocket closed'));
            }
            pendingRequests.clear();
        };
        ws.onerror = (err) => {
            reject(err);
        };
    });
    return connectPromise;
}

// Send a message to the sidecar (fire-and-forget, like ipcRenderer.send)
export function send(channel: string, ...args: any[]): void {
    const msg = JSON.stringify({ type: 'invoke', channel, args });
    if (connected && ws) {
        ws.send(msg);
    } else {
        messageQueue.push(msg);
    }
}

// Send a message and wait for a response (like ipcRenderer.invoke)
export function invoke(channel: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
        const id = reqId++;
        pendingRequests.set(id, { resolve, reject });
        const msg = JSON.stringify({ type: 'invoke', channel, args, id });
        if (connected && ws) {
            ws.send(msg);
        } else {
            messageQueue.push(msg);
        }
    });
}

// Listen for events from the sidecar (like ipcRenderer.on)
export function listen(channel: string, handler: (...args: any[]) => void): () => void {
    if (!eventListeners.has(channel)) {
        eventListeners.set(channel, new Set());
    }
    // Wrap handler to spread args array
    const wrappedHandler = (data: any) => {
        if (Array.isArray(data)) handler(...data);
        else handler(data);
    };
    eventListeners.get(channel)!.add(wrappedHandler);
    return () => {
        eventListeners.get(channel)?.delete(wrappedHandler);
    };
}

// Remove all listeners for a specific channel
export function removeAllListeners(channel: string): void {
    eventListeners.delete(channel);
}
