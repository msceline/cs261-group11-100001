package com.team.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.team.project.entity.User;
import com.team.project.repository.UserRepository;
import com.team.project.service.TuAuthClient.TuStudent;

class TuStudentServiceTest {

    private TuAuthClient tuAuthClient;
    private UserRepository userRepository;
    private TuStudentService service;

    @BeforeEach
    void setUp() {
        tuAuthClient = mock(TuAuthClient.class);
        userRepository = mock(UserRepository.class);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(77);
            return u;
        });
        service = new TuStudentService(tuAuthClient, userRepository);
    }

    @Test
    void unknownToTuIsEmptyEvenIfTheLocalTableHasThatId() {
        when(tuAuthClient.findStudent("0000000000")).thenReturn(Optional.empty());
        when(userRepository.findByTu_id("0000000000")).thenReturn(Optional.of(
                new User(1, "0000000000", "student", "Stale", "s@x.com", null, LocalDateTime.now())));

        assertTrue(service.findOrCreateUser("0000000000").isEmpty());
        verify(userRepository, never()).save(any());
    }

    @Test
    void studentWhoHasLoggedInBeforeIsReused() {
        User existing = new User(5, "6809617118", "student", "Nat", "n@x.com", null, LocalDateTime.now());
        when(tuAuthClient.findStudent("6809617118")).thenReturn(Optional.of(new TuStudent("6809617118", "ณัฐรดา")));
        when(userRepository.findByTu_id("6809617118")).thenReturn(Optional.of(existing));

        assertEquals(5, service.findOrCreateUser(" 6809617118 ").orElseThrow().getUserId());
        verify(userRepository, never()).save(any());
    }

    @Test
    void studentWhoNeverLoggedInIsCreatedFromTheTuData() {
        when(tuAuthClient.findStudent("6809617431")).thenReturn(Optional.of(new TuStudent("6809617431", "ศิวดล")));
        when(userRepository.findByTu_id("6809617431")).thenReturn(Optional.empty());

        User created = service.findOrCreateUser("6809617431").orElseThrow();

        assertEquals(77, created.getUserId());
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("6809617431", saved.getValue().getTu_id());
        assertEquals("ศิวดล", saved.getValue().getDisplayName());
        assertEquals("student", saved.getValue().getRole());
        assertEquals("6809617431@dome.tu.ac.th", saved.getValue().getEmail());
    }

    @Test
    void lookupTrimsTheId() {
        when(tuAuthClient.findStudent("6809617118")).thenReturn(Optional.of(new TuStudent("6809617118", "Nat")));

        assertEquals("Nat", service.lookup("  6809617118 ").orElseThrow().displayName());
    }
}
