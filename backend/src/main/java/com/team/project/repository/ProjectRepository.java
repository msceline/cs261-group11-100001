package com.team.project.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.team.project.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Integer> {

    List<Project> findByHost_UserId(Integer hostId);

    List<Project> findBySubjectId(String subjectId);

    List<Project> findByProjectNameContainingIgnoreCase(String keyword);
}

