package com.team.project.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.team.project.entity.ProjectMember;

/**
 * findByUser_UserId, findByProject_ProjectIdAndUser_UserId and existsByProject_ProjectIdAndUser_UserId only see
 * ACCEPTED members, so a pending invitation never grants access. findByProject_ProjectId and findAnyStatus see
 * everyone.
 */
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Integer> {

    /** Every member of the project, including pending invitations. */
    List<ProjectMember> findByProject_ProjectId(Integer projectId);

    @Query("select m from ProjectMember m where m.user.userId = :userId and m.status = 'accepted'")
    List<ProjectMember> findByUser_UserId(@Param("userId") Integer userId);

    @Query("select m from ProjectMember m where m.project.projectId = :projectId and m.user.userId = :userId "
            + "and m.status = 'accepted'")
    Optional<ProjectMember> findByProject_ProjectIdAndUser_UserId(@Param("projectId") Integer projectId,
                                                                  @Param("userId") Integer userId);

    @Query("select count(m) > 0 from ProjectMember m where m.project.projectId = :projectId "
            + "and m.user.userId = :userId and m.status = 'accepted'")
    boolean existsByProject_ProjectIdAndUser_UserId(@Param("projectId") Integer projectId,
                                                    @Param("userId") Integer userId);

    /** The membership row regardless of status (pending or accepted). */
    @Query("select m from ProjectMember m where m.project.projectId = :projectId and m.user.userId = :userId")
    Optional<ProjectMember> findAnyStatus(@Param("projectId") Integer projectId, @Param("userId") Integer userId);

    List<ProjectMember> findByUser_UserIdAndStatus(Integer userId, String status);
}
