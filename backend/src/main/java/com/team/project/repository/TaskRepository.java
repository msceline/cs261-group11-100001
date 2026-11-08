package com.team.project.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.team.project.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Integer> {

    List<Task> findByProject_ProjectId(Integer projectId);

    List<Task> findByAssignee_UserId(Integer assigneeId);

    List<Task> findByProject_ProjectIdAndStatus(Integer projectId, String status);

    long countByProject_ProjectId(Integer projectId);

    long countByProject_ProjectIdAndStatus(Integer projectId, String status);
}

