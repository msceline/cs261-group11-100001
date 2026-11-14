package com.team.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.team.project.entity.Meeting;

public interface MeetingRepository extends JpaRepository<Meeting, Integer> {

    List<Meeting> findByProject_ProjectIdOrderByDateTimeAsc(Integer projectId);
}
