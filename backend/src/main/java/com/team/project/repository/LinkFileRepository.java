package com.team.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.team.project.entity.LinkFile;

public interface LinkFileRepository extends JpaRepository<LinkFile, Integer> {

    // Find all LinkFiles in a project
    List<LinkFile> findByProject_ProjectId(Integer projectId);

    // Find all LinkFiles uploaded by a user
    List<LinkFile> findByUploader_UserId(Integer userId);

    // Find a specific LinkFile in a project
    Optional<LinkFile> findByLinkFileIdAndProject_ProjectId(
            Integer linkFileId, Integer projectId);

    // Delete a specific LinkFile in a project
    long deleteByLinkFileIdAndProject_ProjectId(
            Integer linkFileId, Integer projectId);
}
