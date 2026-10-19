package com.team.project.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import com.team.project.dto.member.MemberResponse;
import com.team.project.service.MemberService;

class MemberControllerTest {

    private MemberService memberService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        memberService = mock(MemberService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new MemberController(memberService)).build();
    }

    @Test
    void listReturnsMembersWithRoles() throws Exception {
        when(memberService.list(1, 1)).thenReturn(List.of(
                new MemberResponse(1, 1, 1, "host", "6609650001", "A"),
                new MemberResponse(2, 1, 2, "member", "6609650002", "B")));

        mockMvc.perform(get("/api/projects/1/members").requestAttr("userId", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].roleInProject").value("host"))
                .andExpect(jsonPath("$[1].roleInProject").value("member"));
    }

    @Test
    void listReturns403ForNonMember() throws Exception {
        when(memberService.list(1, 2)).thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));

        mockMvc.perform(get("/api/projects/2/members").requestAttr("userId", 1))
                .andExpect(status().isForbidden());
    }

    @Test
    void addReturns201ForHost() throws Exception {
        when(memberService.add(eq(1), eq(1), any()))
                .thenReturn(new MemberResponse(3, 1, 3, "member", "9900000001", "V"));

        mockMvc.perform(post("/api/projects/1/members").requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"9900000001\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(3))
                .andExpect(jsonPath("$.roleInProject").value("member"));
    }

    @Test
    void addReturns403ForNonHost() throws Exception {
        when(memberService.add(eq(2), eq(1), any())).thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));

        mockMvc.perform(post("/api/projects/1/members").requestAttr("userId", 2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"9900000001\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void addReturns409WhenAlreadyMember() throws Exception {
        when(memberService.add(eq(1), eq(1), any())).thenThrow(new ResponseStatusException(HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/projects/1/members").requestAttr("userId", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tu_id\":\"6609650002\"}"))
                .andExpect(status().isConflict());
    }
}
