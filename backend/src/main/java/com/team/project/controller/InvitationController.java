package com.team.project.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.dto.member.InvitationResponse;
import com.team.project.service.MemberService;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final MemberService memberService;

    public InvitationController(MemberService memberService) {
        this.memberService = memberService;
    }

    /** Pending invitations of the caller. */
    @GetMapping
    public List<InvitationResponse> pending(@RequestAttribute("userId") int userId) {
        return memberService.pendingInvitations(userId);
    }
}
