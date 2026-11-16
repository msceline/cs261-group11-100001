package com.team.project.validation;

import java.net.URI;
import java.net.URISyntaxException;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class HttpUrlValidator
        implements ConstraintValidator<ValidHttpUrl, String> {

    @Override
    public boolean isValid(
            String value,
            ConstraintValidatorContext context) {

        if (value == null || value.isBlank()) {
            return true;
        }

        try {
            URI uri = new URI(value);

            String scheme = uri.getScheme();
            String host = uri.getHost();

            boolean validScheme =
                    "http".equalsIgnoreCase(scheme)
                    || "https".equalsIgnoreCase(scheme);

            boolean validHost =
                    host != null
                    && !host.isBlank();

            boolean validAuthority =
                    uri.getRawAuthority() != null
                    && !uri.getRawAuthority().isBlank();

            return validScheme && validHost && validAuthority;

        } catch (URISyntaxException e) {
            return false;
        }
    }
}
