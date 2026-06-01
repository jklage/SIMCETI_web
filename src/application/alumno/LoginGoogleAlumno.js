class LoginGoogleAlumno {
    constructor(googleAuthPort) {
        this.googleAuthPort = googleAuthPort;
    }

    async ejecutar({ token }) {
        if (!token) {
            throw { code: 'CAMPOS_FALTANTES', message: 'Token requerido' };
        }
        const email = await this.googleAuthPort.verificarToken(token);
        return { email };
    }
}

module.exports = LoginGoogleAlumno;
