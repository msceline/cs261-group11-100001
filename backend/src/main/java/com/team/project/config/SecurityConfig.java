package com.team.project.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.team.project.security.JwtFilter;

@Configuration
public class SecurityConfig {

    /** Registers the JWT filter for /api/* only (and stops it auto-registering for every URL). */
    @Bean
    public FilterRegistrationBean<JwtFilter> jwtFilterRegistration(JwtFilter filter) {
        FilterRegistrationBean<JwtFilter> reg = new FilterRegistrationBean<>(filter);
        reg.addUrlPatterns("/api/*");
        return reg;
    }
}
