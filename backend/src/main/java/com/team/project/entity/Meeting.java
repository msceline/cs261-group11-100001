package com.team.project.entity;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Meeting entity. All date-time columns are stored in UTC and converted to
 * +07:00 (Asia/Bangkok) only when displayed.
 */
@Entity
@Table(name = "meetings", indexes = {
        @Index(name = "idx_meeting_project_date", columnList = "project_id, meeting_date"),
        @Index(name = "idx_meeting_project_status_date", columnList = "project_id, status, meeting_date"),
        @Index(name = "idx_meeting_created_by", columnList = "created_by")
})
public class Meeting {

    public static final String STATUS_SCHEDULED = "SCHEDULED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String TYPE_MEETING = "meeting";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meeting_id")
    private Integer meetingId;

    // ON DELETE CASCADE: deleting a project removes its meetings
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // ON DELETE RESTRICT (default): a user who created meetings cannot be deleted
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Nationalized
    @Column(name = "meeting_topic", length = 255, nullable = false)
    private String meetingTopic;

    @Nationalized
    @Column(name = "meeting_description", columnDefinition = "NVARCHAR(MAX)")
    private String meetingDescription;

    @Column(name = "meeting_date", nullable = false)
    private LocalDateTime meetingDate;

    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    @Column(name = "type", length = 20, nullable = false)
    private String type = TYPE_MEETING;

    @Column(name = "status", length = 20, nullable = false)
    private String status = STATUS_SCHEDULED;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Meeting() {
    }

    public Meeting(Integer meetingId, Project project, User createdBy, String meetingTopic,
                   String meetingDescription, LocalDateTime meetingDate, String meetingLink,
                   String type, String status, LocalDateTime cancelledAt,
                   LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.meetingId = meetingId;
        this.project = project;
        this.createdBy = createdBy;
        this.meetingTopic = meetingTopic;
        this.meetingDescription = meetingDescription;
        this.meetingDate = meetingDate;
        this.meetingLink = meetingLink;
        this.type = type != null ? type : TYPE_MEETING;
        this.status = status != null ? status : STATUS_SCHEDULED;
        this.cancelledAt = cancelledAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
        if (this.type == null) {
            this.type = TYPE_MEETING;
        }
        if (this.status == null) {
            this.status = STATUS_SCHEDULED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    /** Soft cancel: sets status and cancelledAt together. */
    public void cancel() {
        this.status = STATUS_CANCELLED;
        this.cancelledAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Integer getMeetingId() {
        return meetingId;
    }

    public void setMeetingId(Integer meetingId) {
        this.meetingId = meetingId;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public String getMeetingTopic() {
        return meetingTopic;
    }

    public void setMeetingTopic(String meetingTopic) {
        this.meetingTopic = meetingTopic;
    }

    public String getMeetingDescription() {
        return meetingDescription;
    }

    public void setMeetingDescription(String meetingDescription) {
        this.meetingDescription = meetingDescription;
    }

    public LocalDateTime getMeetingDate() {
        return meetingDate;
    }

    public void setMeetingDate(LocalDateTime meetingDate) {
        this.meetingDate = meetingDate;
    }

    public String getMeetingLink() {
        return meetingLink;
    }

    public void setMeetingLink(String meetingLink) {
        this.meetingLink = meetingLink;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
