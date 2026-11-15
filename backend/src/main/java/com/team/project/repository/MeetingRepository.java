package com.team.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.team.project.entity.Meeting;

public interface MeetingRepository extends JpaRepository<Meeting, Integer>, JpaSpecificationExecutor<Meeting> {
}
