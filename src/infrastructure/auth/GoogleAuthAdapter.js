const { OAuth2Client } = require('google-auth-library');

// Adaptador secundario: implementa el puerto de autenticación Google
class GoogleAuthAdapter {
    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async verificarToken(token) {
        const ticket = await this.client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        return ticket.getPayload().email;
    }
}

module.exports = GoogleAuthAdapter;
