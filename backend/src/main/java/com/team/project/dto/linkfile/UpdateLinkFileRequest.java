package com.team.project.dto.linkfile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateLinkFileRequest {

    @NotBlank(message = "Link name is required")
    @Size(max = 200, message = "Link name must not exceed 200 characters")
    private String linkName;

    @NotBlank(message = "Link URL is required")
    @Size(max = 2048, message = "Link URL must not exceed 2048 characters")
    @Pattern(
        regexp = "^https?://\\S+$",
        message = "Link URL must start with http:// or https://"
    )
    private String linkUrl;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

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
}
