const ADMIN_API_URL = 'https://paris-private-backend.onrender.com';

function safeReturnPath() {
    const value = new URLSearchParams(window.location.search).get('returnTo');
    return ['/reservation', '/reservation.html'].includes(value) ? value : '/reservation';
}

async function verifyAdmin(accessToken) {
    const response = await fetch(`${ADMIN_API_URL}/api/admin/session`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000)
    });
    return response.ok;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminLoginForm');
    const status = document.getElementById('adminLoginStatus');
    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        if (button.disabled) return;
        button.disabled = true;
        status.textContent = 'Signing in…';
        try {
            if (!window.ppatSupabase) throw new Error('Authentication unavailable');
            const email = document.getElementById('adminEmail').value.trim();
            const password = document.getElementById('adminPassword').value;
            const { data, error } = await window.ppatSupabase.auth.signInWithPassword({ email, password });
            if (error || !data?.session) {
                status.textContent = 'Unable to sign in.';
                return;
            }
            if (!await verifyAdmin(data.session.access_token)) {
                status.textContent = 'This account is not authorized for administrator access.';
                await window.ppatSupabase.auth.signOut();
                return;
            }
            window.location.assign(safeReturnPath());
        } catch {
            status.textContent = 'Unable to verify administrator access. Please try again.';
        } finally {
            button.disabled = false;
            document.getElementById('adminPassword').value = '';
        }
    });
});
