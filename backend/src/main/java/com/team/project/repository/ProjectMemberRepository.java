package com.team.project.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.team.project.entity.ProjectMember;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Integer> {

    List<ProjectMember> findByProject_ProjectId(Integer projectId);

    List<ProjectMember> findByUser_UserId(Integer userId);

    Optional<ProjectMember> findByProject_ProjectIdAndUser_UserId(Integer projectId, Integer userId);

    boolean existsByProject_ProjectIdAndUser_UserId(Integer projectId, Integer userId);
}
