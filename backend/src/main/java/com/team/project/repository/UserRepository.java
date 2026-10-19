package com.team.project.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.team.project.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {

    @Query("SELECT u FROM User u WHERE u.tu_id = :tu_id")
    Optional<User> findByTu_id(@Param("tu_id") String tu_id);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.tu_id = :tu_id")
    boolean existsByTu_id(@Param("tu_id") String tu_id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    default Optional<User> findByTuId(String tuId) {
        return findByTu_id(tuId);
    }

    default Optional<User> findByStudentId(String studentId) {
        return findByTu_id(studentId);
    }

    default boolean existsByTuId(String tuId) {
        return existsByTu_id(tuId);
    }

    default boolean existsByStudentId(String studentId) {
        return existsByTu_id(studentId);
    }
}
