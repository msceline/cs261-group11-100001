package com.team.project.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.OptionalInt;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Minimal HS256 JWT implementation (no extra dependencies). */
@Service
public class JwtService {

    private static final Base64.Encoder ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC = Base64.getUrlDecoder();
    private static final String HEADER =
            ENC.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final byte[] secret;
    private final long expirationSeconds;

    private static final int MIN_SECRET_BYTES = 32;

    /** The secret has no default: set JWT_SECRET (at least 32 characters) in the environment. */
    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration-seconds:86400}") long expirationSeconds) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("jwt.secret must be at least " + MIN_SECRET_BYTES + " characters");
        }
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(int userId) {
        long exp = System.currentTimeMillis() / 1000 + expirationSeconds;
        String payload = ENC.encodeToString(
                ("{\"sub\":\"" + userId + "\",\"exp\":" + exp + "}").getBytes(StandardCharsets.UTF_8));
        String unsigned = HEADER + "." + payload;
        return unsigned + "." + sign(unsigned);
    }

    /** Returns the user id if the token is valid and not expired. */
    public OptionalInt validateAndGetUserId(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return OptionalInt.empty();
            String expected = sign(parts[0] + "." + parts[1]);
            if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8))) {
                return OptionalInt.empty();
            }
            String json = new String(DEC.decode(parts[1]), StandardCharsets.UTF_8);
            int userId = Integer.parseInt(extract(json, "\"sub\":\"", "\""));
            long exp = Long.parseLong(extract(json, "\"exp\":", "}"));
            if (exp < System.currentTimeMillis() / 1000) return OptionalInt.empty();
            return OptionalInt.of(userId);
        } catch (RuntimeException e) {
            return OptionalInt.empty();
        }
    }

    private static String extract(String json, String start, String end) {
        int s = json.indexOf(start) + start.length();
        return json.substring(s, json.indexOf(end, s));
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return ENC.encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
