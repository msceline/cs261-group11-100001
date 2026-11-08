package com.team.project.service;

import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

/** Verifies a Thammasat account against the TU REST API (POST /auth/Ad/verify). */
@Component
public class TuAuthClient {

    /** Account details returned by the TU API on a successful login. */
    public record TuUser(String username, String displayName, String email, String type) {}

    /** A student found in the TU directory. */
    public record TuStudent(String username, String displayName) {}

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

    /**
     * Looks a student up by id (GET /profile/std/info/?id=...). Empty when TU says there is no such student;
     * 502 when the TU API itself cannot be reached.
     */
    @SuppressWarnings("unchecked")
    public Optional<TuStudent> findStudent(String studentId) {
        if (studentId == null || !studentId.matches("[A-Za-z0-9]{1,20}")) return Optional.empty();
        try {
            Map<String, Object> body = restClient.get()
                    .uri(uri -> uri.path("/profile/std/info/").queryParam("id", studentId).build())
                    .header("Application-Key", apiKey)
                    .retrieve()
                    .body(Map.class);
            if (body == null || !Boolean.TRUE.equals(body.get("status"))) return Optional.empty();
            String username = str(body.get("username"));
            String name = str(body.get("displayname_th"));
            return Optional.of(new TuStudent(username, name == null || name.isBlank() ? username : name));
        } catch (HttpClientErrorException e) {
            // 400 "Student ID Invalid!" means nobody has that id
            return Optional.empty();
        } catch (RestClientException e) {
            log.warn("TU API student lookup failed for {}: {}", studentId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "TU API is unavailable");
        }
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
