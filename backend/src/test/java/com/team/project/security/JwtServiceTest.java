package com.team.project.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "test-secret-test-secret-test-secret";

    @Test
    void tokenRoundTripsTheUserId() {
        JwtService jwt = new JwtService(SECRET, 3600);

        assertEquals(7, jwt.validateAndGetUserId(jwt.generateToken(7)).getAsInt());
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String token = new JwtService("another-secret-another-secret-0000", 3600).generateToken(7);

        assertTrue(new JwtService(SECRET, 3600).validateAndGetUserId(token).isEmpty());
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, -10);

        assertTrue(jwt.validateAndGetUserId(jwt.generateToken(7)).isEmpty());
    }

    @Test
    void shortSecretIsRefused() {
        assertThrows(IllegalStateException.class, () -> new JwtService("too-short", 3600));
    }
}
