const ADMIN_API_URL = 'https://paris-private-backend.onrender.com';

function safeReturnPath() {
    const value = new URLSearchParams(window.location.search).get('returnTo');
    return value && value.startsWith('/') && !value.startsWith('//') ? value : '/reservation.html';
}

async function verifyAdmin(accessToken) {
    const response = await fetch(`${ADMIN_API_URL}/api/admin/session`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.ok;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminLoginForm');
    const status = document.getElementById('adminLoginStatus');

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        status.textContent = '';
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const { data, error } = await window.ppatSupabase.auth.signInWithPassword({ email, password });

        if (error || !data.session) {
            status.textContent = 'Unable to sign in.';
            return;
        }
        if (!await verifyAdmin(data.session.access_token)) {
            await window.ppatSupabase.auth.signOut();
            status.textContent = 'This account is not authorized for administrator access.';
            return;
        }

        window.location.assign(safeReturnPath());
    });
});
