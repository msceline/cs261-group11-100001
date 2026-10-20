package com.team.project.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.team.project.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByStudentId(String studentId);

    Optional<User> findByEmail(String email);

    boolean existsByStudentId(String studentId);

    boolean existsByEmail(String email);
}
