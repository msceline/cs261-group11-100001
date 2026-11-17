package com.team.project.exception;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.controller.LinkFileController;

@RestControllerAdvice(assignableTypes = LinkFileController.class)
public class GlobalExceptionHandler {

    // Handle Validation Error (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex) {

        List<Map<String, String>> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toErrorDetail)
                .toList();

        String message = "Validation failed";

        boolean invalidLinkUrl = details.stream()
                .anyMatch(detail -> "linkUrl".equals(detail.get("field")));

        if (invalidLinkUrl) {
            message = "Invalid link URL";
        }

        Map<String, Object> body = Map.of(
                "error", "VALIDATION_ERROR",
                "message", message,
                "details", details);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(body);
    }

    // Handle Service Exceptions (403, 404, etc.)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(
            ResponseStatusException ex) {

        int status = ex.getStatusCode().value();
        String reason = ex.getReason();

        String error;
        String message;

        if (status == 403) {
            error = "FORBIDDEN";
            message = "You do not have permission to access this linkfile";

        } else if (status == 404) {

            if ("Project not found".equals(reason)) {
                error = "PROJECT_NOT_FOUND";
                message = "Project not found";

            } else if ("Link not found".equals(reason)) {
                error = "LINKFILE_NOT_FOUND";
                message = "Linkfile not found";

            } else {
                error = "NOT_FOUND";
                message = reason != null ? reason : "Resource not found";
            }

        } else {
            error = "HTTP_ERROR";
            message = reason != null ? reason : "Request failed";
        }

        Map<String, String> body = Map.of(
                "error", error,
                "message", message);

        return ResponseEntity
                .status(ex.getStatusCode())
                .body(body);
    }

    // Handle Unexpected Errors (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpectedException(
            Exception ex) {

        Map<String, String> body = Map.of(
                "error", "INTERNAL_SERVER_ERROR",
                "message", "An unexpected error occurred");

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(body);
    }

    private Map<String, String> toErrorDetail(FieldError error) {
        return Map.of(
                "field", error.getField(),
                "message", error.getDefaultMessage() != null
                        ? error.getDefaultMessage()
                        : "Invalid value");
    }
}
