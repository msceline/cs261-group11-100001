package com.team.project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "tu_id", length = 20, nullable = false, unique = true)
    private String tu_id;

    @Column(name = "role", length = 20, nullable = false)
    private String role = "student";

    @Nationalized
    @Column(name = "display_name", length = 100, nullable = false)
    private String displayName;

    @Column(name = "email", length = 100, nullable = false, unique = true)
    private String email;

    @Column(name = "password", length = 255, nullable = true)
    private String password;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public User() {
    }

    public User(Integer userId, String tu_id, String role, String displayName, String email, String password, LocalDateTime createdAt) {
        this.userId = userId;
        this.tu_id = tu_id;
        this.role = role != null ? role : "student";
        this.displayName = displayName;
        this.email = email;
        this.password = password;
        this.createdAt = createdAt;
    }

    /** Backward-compatible constructor for existing mock data. */
    public User(int userId, String tu_id, String password, String displayName, String email, LocalDateTime createdAt) {
        this(userId, tu_id, "student", displayName, email, password, createdAt);
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.role == null) {
            this.role = "student";
        }
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getTu_id() {
        return tu_id;
    }

    public void setTu_id(String tu_id) {
        this.tu_id = tu_id;
    }

    public String getTuId() {
        return tu_id;
    }

    public void setTuId(String tuId) {
        this.tu_id = tuId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
