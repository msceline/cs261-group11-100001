package com.team.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.team.project.entity.Meeting;

public interface MeetingRepository extends JpaRepository<Meeting, Integer> {

    List<Meeting> findByProject_ProjectIdOrderByDateTimeAsc(Integer projectId);

    Optional<Meeting> findByMeetingIdAndProject_ProjectId(Integer meetingId, Integer projectId);
}
