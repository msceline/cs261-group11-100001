package com.team.project.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.team.project.entity.User;
import com.team.project.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> findByStudentId(String studentId) {
        return userRepository.findByStudentId(studentId);
    }

    public Optional<User> findById(int userId) {
        return userRepository.findById(userId);
    }

    public User save(User user) {
        return userRepository.save(user);
    }
}
