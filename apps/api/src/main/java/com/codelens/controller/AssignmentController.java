package com.codelens.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.codelens.dto.AssignmentResponse;
import com.codelens.dto.CreateAssignmentRequest;
import com.codelens.dto.CreateSubmissionRequest;
import com.codelens.dto.SubmissionResponse;
import com.codelens.service.AssignmentService;
import com.codelens.service.SubmissionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

	private final AssignmentService assignmentService;
	private final SubmissionService submissionService;

	public AssignmentController(AssignmentService assignmentService, SubmissionService submissionService) {
		this.assignmentService = assignmentService;
		this.submissionService = submissionService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AssignmentResponse create(@Valid @RequestBody CreateAssignmentRequest request) {
		return assignmentService.create(request);
	}

	@GetMapping("/{id}")
	public AssignmentResponse get(@PathVariable Long id) {
		return assignmentService.getById(id);
	}

	@GetMapping
	public List<AssignmentResponse> list() {
		return assignmentService.list();
	}

	@PostMapping("/{assignmentId}/submissions")
	@ResponseStatus(HttpStatus.CREATED)
	public SubmissionResponse submit(
			@PathVariable Long assignmentId,
			@Valid @RequestBody CreateSubmissionRequest request
	) {
		return submissionService.create(assignmentId, request);
	}

	@GetMapping("/{assignmentId}/submissions")
	public List<SubmissionResponse> listSubmissions(@PathVariable Long assignmentId) {
		return submissionService.listForAssignment(assignmentId);
	}
}
