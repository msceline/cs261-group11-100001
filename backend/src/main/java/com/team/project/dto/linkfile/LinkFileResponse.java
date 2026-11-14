package com.team.project.dto.linkfile;

import java.time.LocalDateTime;
import com.team.project.entity.LinkFile;

public class LinkFileResponse {

    private Integer linkFileId;
    private Integer projectId;
    private String linkName;
    private String linkUrl;
    private String description;
    private Integer uploaderId;
    private LocalDateTime createdAt;

    public LinkFileResponse() {
    }

    public LinkFileResponse(Integer linkFileId, Integer projectId,
                            String linkName, String linkUrl,
                            String description, Integer uploaderId,
                            LocalDateTime createdAt) {
        this.linkFileId = linkFileId;
        this.projectId = projectId;
        this.linkName = linkName;
        this.linkUrl = linkUrl;
        this.description = description;
        this.uploaderId = uploaderId;
        this.createdAt = createdAt;
    }

    public Integer getLinkFileId() {
        return linkFileId;
    }

    public void setLinkFileId(Integer linkFileId) {
        this.linkFileId = linkFileId;
    }

    public Integer getProjectId() {
        return projectId;
    }

    public void setProjectId(Integer projectId) {
        this.projectId = projectId;
    }

    public String getLinkName() {
        return linkName;
    }

    public void setLinkName(String linkName) {
        this.linkName = linkName;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getUploaderId() {
        return uploaderId;
    }

    public void setUploaderId(Integer uploaderId) {
        this.uploaderId = uploaderId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static LinkFileResponse from(LinkFile linkFile) {
    return new LinkFileResponse(
            linkFile.getLinkFileId(),
            linkFile.getProject().getProjectId(),
            linkFile.getLinkName(),
            linkFile.getLinkUrl(),
            linkFile.getDescription(),
            linkFile.getUploader().getUserId(),
            linkFile.getCreatedAt()
        );
    }
}
