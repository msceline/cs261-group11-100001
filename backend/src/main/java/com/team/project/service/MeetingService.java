package com.team.project.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.meeting.CreateMeetingRequest;
import com.team.project.dto.meeting.MeetingResponse;
import com.team.project.entity.Meeting;
import com.team.project.entity.Project;
import com.team.project.repository.MeetingRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;

@Service
public class MeetingService {

    private static final int MAX_TOPIC_LENGTH = 200;
    private static final int MAX_LOCATION_LENGTH = 1000;

    private final MeetingRepository meetingRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    public MeetingService(MeetingRepository meetingRepository, ProjectRepository projectRepository,
                          ProjectMemberRepository memberRepository) {
        this.meetingRepository = meetingRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    public List<MeetingResponse> listForProject(int userId, int projectId) {
        requireMember(userId, projectId);
        return meetingRepository.findByProject_ProjectIdOrderByDateTimeAsc(projectId).stream()
                .map(MeetingResponse::from)
                .toList();
    }

    public MeetingResponse create(int userId, int projectId, CreateMeetingRequest request) {
        if (request == null) throw bad("Request body is required");

        String topic = request.topic() == null ? "" : request.topic().trim();
        if (topic.isEmpty() || topic.length() > MAX_TOPIC_LENGTH) {
            throw bad("topic must be 1-200 characters");
        }
        if (request.dateTime() == null) {
            throw bad("dateTime is required");
        }

        String location = blankToNull(request.location());
        if (location != null && location.length() > MAX_LOCATION_LENGTH) {
            throw bad("location must be at most 1000 characters");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        requireMember(userId, projectId);

        Meeting meeting = new Meeting();
        meeting.setProject(project);
        meeting.setTopic(topic);
        meeting.setDateTime(request.dateTime());
        meeting.setLocation(location);
        meeting.setDescription(blankToNull(request.description()));
        return MeetingResponse.from(meetingRepository.save(meeting));
    }

    private void requireMember(int userId, int projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
        if (!memberRepository.existsByProject_ProjectIdAndUser_UserId(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this project");
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
