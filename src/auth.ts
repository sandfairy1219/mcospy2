import { execSync } from 'child_process';
import { createHash } from 'crypto';

let cachedHwid: string | null = null;

export function getHardwareId(): string {
    if (cachedHwid) return cachedHwid;

    const parts: string[] = [];
    const commands = [
        'wmic baseboard get serialnumber',
        'wmic diskdrive get serialnumber',
        'wmic bios get serialnumber',
    ];

    for (const cmd of commands) {
        try {
            const out = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
            const val = out.split('\n')[1]?.trim() || '';
            if (val && val !== 'To be filled by O.E.M.') parts.push(val);
        } catch {
            // ignore
        }
    }

    cachedHwid = createHash('sha256').update(parts.join('|')).digest('hex');
    return cachedHwid;
}

export async function authVerify(serverUrl: string, hardwareId: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const res = await fetch(`${serverUrl}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hardwareId }),
        });
        return await res.json() as any;
    } catch {
        return { ok: false, error: 'Server unreachable' };
    }
}

export async function authActivate(serverUrl: string, licenseKey: string, hardwareId: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const res = await fetch(`${serverUrl}/api/auth/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey, hardwareId }),
        });
        return await res.json() as any;
    } catch {
        return { ok: false, error: 'Server unreachable' };
    }
}
