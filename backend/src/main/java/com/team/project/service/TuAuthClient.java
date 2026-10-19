package com.team.project.service;

import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Verifies a Thammasat account against the TU REST API (POST /auth/Ad/verify). */
@Component
public class TuAuthClient {

    /** Account details returned by the TU API on a successful login. */
    public record TuUser(String username, String displayName, String email, String type) {}

    private static final Logger log = LoggerFactory.getLogger(TuAuthClient.class);

    private final RestClient restClient;
    private final String apiKey;

    public TuAuthClient(@Value("${tu.api.url}") String apiUrl, @Value("${tu.api.key:}") String apiKey) {
        this.restClient = RestClient.builder().baseUrl(apiUrl).build();
        this.apiKey = apiKey;
    }

    /** Returns empty when the credentials are rejected or the TU API cannot be reached. */
    @SuppressWarnings("unchecked")
    public Optional<TuUser> verify(String username, String password) {
        try {
            Map<String, Object> body = restClient.post()
                    .uri("/auth/Ad/verify")
                    .header("Application-Key", apiKey)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(Map.of("UserName", username, "PassWord", password))
                    .retrieve()
                    .body(Map.class);
            if (body == null || !Boolean.TRUE.equals(body.get("status"))) return Optional.empty();
            return Optional.of(new TuUser(
                    str(body.get("username")),
                    str(body.get("displayname_th")),
                    str(body.get("email")),
                    str(body.get("type"))));
        } catch (RestClientException e) {
            // 4xx from TU means bad credentials; anything else is an outage. Either way, don't log the password.
            log.warn("TU API verify failed for {}: {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
