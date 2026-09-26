package com.codelens.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codelens.domain.Assignment;
import com.codelens.domain.Submission;
import com.codelens.domain.User;
import com.codelens.domain.UserRole;
import com.codelens.dto.CreateSubmissionRequest;
import com.codelens.dto.SubmissionResponse;
import com.codelens.exception.ApiExceptions;
import com.codelens.repository.SubmissionRepository;

@Service
public class SubmissionService {

	private final SubmissionRepository submissionRepository;
	private final AssignmentService assignmentService;
	private final UserService userService;

	public SubmissionService(
			SubmissionRepository submissionRepository,
			AssignmentService assignmentService,
			UserService userService
	) {
		this.submissionRepository = submissionRepository;
		this.assignmentService = assignmentService;
		this.userService = userService;
	}

	@Transactional
	public SubmissionResponse create(Long assignmentId, CreateSubmissionRequest request) {
		Assignment assignment = assignmentService.requireAssignment(assignmentId);
		User student = userService.requireUser(request.studentId());

		if (student.getRole() != UserRole.STUDENT) {
			throw ApiExceptions.badRequest(
					"INVALID_ROLE",
					"User " + student.getId() + " is not a STUDENT"
			);
		}

		if (assignment.getDueDate().isBefore(LocalDateTime.now())) {
			throw ApiExceptions.badRequest(
					"ASSIGNMENT_CLOSED",
					"Assignment " + assignmentId + " is past its due date"
			);
		}

		if (submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, student.getId())) {
			throw ApiExceptions.conflict(
					"DUPLICATE_SUBMISSION",
					"Student " + student.getId() + " already submitted for assignment " + assignmentId
			);
		}

		Submission submission = submissionRepository.save(
				new Submission(assignment, student, request.code())
		);
		return SubmissionResponse.from(submission);
	}

	@Transactional(readOnly = true)
	public SubmissionResponse getById(Long id) {
		return SubmissionResponse.from(requireSubmission(id));
	}

	@Transactional(readOnly = true)
	public List<SubmissionResponse> listForAssignment(Long assignmentId) {
		assignmentService.requireAssignment(assignmentId);
		return submissionRepository.findByAssignmentIdOrderBySubmittedAtAsc(assignmentId).stream()
				.map(SubmissionResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public Submission requireSubmission(Long id) {
		return submissionRepository.findById(id)
				.orElseThrow(() -> ApiExceptions.notFound(
						"SUBMISSION_NOT_FOUND",
						"Submission " + id + " was not found"
				));
	}
}
