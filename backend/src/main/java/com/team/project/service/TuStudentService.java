package com.team.project.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.team.project.entity.User;
import com.team.project.repository.UserRepository;
import com.team.project.service.TuAuthClient.TuStudent;

/** Checks student ids against the TU API (not the local users table) and links them to local users. */
@Service
public class TuStudentService {

    private final TuAuthClient tuAuthClient;
    private final UserRepository userRepository;

    public TuStudentService(TuAuthClient tuAuthClient, UserRepository userRepository) {
        this.tuAuthClient = tuAuthClient;
        this.userRepository = userRepository;
    }

    /** The student with this id according to TU, or empty when there is none. */
    public Optional<TuStudent> lookup(String studentId) {
        return tuAuthClient.findStudent(studentId == null ? null : studentId.trim());
    }

    /**
     * The local user for a TU student. The id is verified with TU first; a student who has never logged in
     * gets a local user created from the TU data (they are matched by id when they log in later).
     */
    public Optional<User> findOrCreateUser(String studentId) {
        return lookup(studentId).map(student -> userRepository.findByTu_id(student.username())
                .orElseGet(() -> userRepository.save(newUser(student))));
    }

    private static User newUser(TuStudent student) {
        User user = new User();
        user.setTu_id(student.username());
        user.setRole("student");
        user.setDisplayName(student.displayName());
        user.setEmail(student.username() + "@dome.tu.ac.th");
        return user;
    }
}
