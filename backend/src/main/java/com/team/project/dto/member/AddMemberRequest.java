package com.team.project.dto.member;

/** The user being added always joins the project with role "member". */
public record AddMemberRequest(String studentId) {}
