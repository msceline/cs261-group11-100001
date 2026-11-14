package com.team.project.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.linkfile.CreateLinkFileRequest;
import com.team.project.dto.linkfile.UpdateLinkFileRequest;
import com.team.project.dto.linkfile.LinkFileResponse;
import com.team.project.entity.LinkFile;
import com.team.project.entity.Project;
import com.team.project.entity.User;
import com.team.project.repository.LinkFileRepository;
import com.team.project.repository.ProjectMemberRepository;
import com.team.project.repository.ProjectRepository;

@ExtendWith(MockitoExtension.class)
class LinkFileServiceTest {

    @Mock
    private LinkFileRepository linkFileRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository memberRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private LinkFileService linkFileService;

    private Project project;
    private User uploader;
    private LinkFile linkFile;

    @BeforeEach
    void setUp() {
        project = mock(Project.class);
        uploader = mock(User.class);

        lenient().when(uploader.getUserId()).thenReturn(1);

        linkFile = new LinkFile(
                10,
                "Documentation",
                "https://example.com",
                "Project docs",
                project,
                uploader,
                LocalDateTime.of(2026, 11, 14, 10, 0)
        );
    }

    private void mockMember(int userId, int projectId) {
        when(projectRepository.findById(projectId))
                .thenReturn(Optional.of(project));

        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(
                projectId, userId))
                .thenReturn(true);
    }

    private CreateLinkFileRequest createRequest() {
        CreateLinkFileRequest request = new CreateLinkFileRequest();
        request.setLinkName(" Documentation ");
        request.setLinkUrl(" https://example.com ");
        request.setDescription("Project docs");
        return request;
    }

    private UpdateLinkFileRequest updateRequest() {
        UpdateLinkFileRequest request = new UpdateLinkFileRequest();
        request.setLinkName(" Updated Docs ");
        request.setLinkUrl(" https://example.com/updated ");
        request.setDescription("Updated description");
        return request;
    }

    @Test
    void listReturnsLinksForMember() {
        mockMember(1, 1);

        when(linkFileRepository.findByProject_ProjectId(1))
                .thenReturn(List.of(linkFile));

        List<LinkFileResponse> result = linkFileService.list(1, 1);

        assertEquals(1, result.size());
        assertEquals("Documentation", result.get(0).getLinkName());
    }

    @Test
    void listThrows403ForNonMember() {
        when(projectRepository.findById(1))
                .thenReturn(Optional.of(project));

        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 5))
                .thenReturn(false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> linkFileService.list(5, 1));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void listThrows404WhenProjectNotFound() {
        when(projectRepository.findById(99))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> linkFileService.list(1, 99));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void createSavesLink() {
        mockMember(1, 1);

        when(userService.findById(1))
                .thenReturn(Optional.of(uploader));

        when(linkFileRepository.save(any(LinkFile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LinkFileResponse result =
                linkFileService.create(1, 1, createRequest());

        assertEquals("Documentation", result.getLinkName());
        assertEquals("https://example.com", result.getLinkUrl());

        verify(linkFileRepository).save(any(LinkFile.class));
    }

    @Test
    void createThrows400ForNullRequest() {
        mockMember(1, 1);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> linkFileService.create(1, 1, null));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void createThrows404WhenUserNotFound() {
        mockMember(1, 1);

        when(userService.findById(1))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> linkFileService.create(1, 1, createRequest()));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void getReturnsLink() {
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1))
                .thenReturn(true);

        when(linkFileRepository.findByLinkFileIdAndProject_ProjectId(10, 1))
                .thenReturn(Optional.of(linkFile));

        LinkFileResponse result = linkFileService.get(1, 1, 10);

        assertEquals(10, result.getLinkFileId());
        assertEquals("Documentation", result.getLinkName());
    }

    @Test
    void getThrows404WhenLinkNotFound() {
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1))
                .thenReturn(true);

        when(linkFileRepository.findByLinkFileIdAndProject_ProjectId(99, 1))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> linkFileService.get(1, 1, 99));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void updateSavesUpdatedLink() {
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1))
                .thenReturn(true);

        when(linkFileRepository.findByLinkFileIdAndProject_ProjectId(10, 1))
                .thenReturn(Optional.of(linkFile));

        when(linkFileRepository.save(any(LinkFile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LinkFileResponse result =
                linkFileService.update(1, 1, 10, updateRequest());

        assertEquals("Updated Docs", result.getLinkName());
        assertEquals("https://example.com/updated", result.getLinkUrl());
        assertEquals("Updated description", result.getDescription());

        verify(linkFileRepository).save(linkFile);
    }

    @Test
    void updateThrows403ForNonUploader() {
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 2))
                .thenReturn(true);

        when(linkFileRepository.findByLinkFileIdAndProject_ProjectId(10, 1))
                .thenReturn(Optional.of(linkFile));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> linkFileService.update(2, 1, 10, updateRequest()));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(linkFileRepository, never()).save(any(LinkFile.class));
    }

    @Test
    void deleteRemovesLink() {
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 1))
                .thenReturn(true);

        when(linkFileRepository.findByLinkFileIdAndProject_ProjectId(10, 1))
                .thenReturn(Optional.of(linkFile));

        linkFileService.delete(1, 1, 10);

        verify(linkFileRepository).delete(linkFile);
    }

    @Test
    void deleteThrows403ForNonUploader() {
        when(memberRepository.existsByProject_ProjectIdAndUser_UserId(1, 2))
                .thenReturn(true);

        when(linkFileRepository.findByLinkFileIdAndProject_ProjectId(10, 1))
                .thenReturn(Optional.of(linkFile));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> linkFileService.delete(2, 1, 10));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(linkFileRepository, never()).delete(any(LinkFile.class));
    }
}
