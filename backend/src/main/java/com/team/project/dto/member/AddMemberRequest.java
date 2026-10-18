package com.team.project.dto.member;

/** The user (identified by TU id) being added always joins the project with role "member". */
public record AddMemberRequest(String tuId) {}
