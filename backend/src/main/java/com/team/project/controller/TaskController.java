package com.team.project.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team.project.dto.task.CreateTaskRequest;
import com.team.project.dto.task.TaskResponse;
import com.team.project.service.TaskService;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /** Tasks of the projects the caller belongs to. */
    @GetMapping
    public List<TaskResponse> list(@RequestAttribute("userId") int userId) {
        return taskService.listForMember(userId).stream().map(TaskResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(@RequestAttribute("userId") int userId, @PathVariable int id) {
        return taskService.getTaskById(userId, id)
                .<ResponseEntity<?>>map(t -> ResponseEntity.ok(TaskResponse.from(t)))
                .orElseGet(TaskController::notFound);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@RequestAttribute("userId") int userId,
                                                   @RequestBody CreateTaskRequest request) {
        TaskResponse created = TaskResponse.from(taskService.createTask(userId, request));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@RequestAttribute("userId") int userId, @PathVariable int id,
                                        @RequestBody CreateTaskRequest request) {
        return taskService.updateTask(userId, id, request)
                .<ResponseEntity<?>>map(t -> ResponseEntity.ok(TaskResponse.from(t)))
                .orElseGet(TaskController::notFound);
    }

    private static ResponseEntity<?> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Task not found"));
    }
}
