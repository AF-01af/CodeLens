package com.codelens.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codelens.domain.Assignment;
import com.codelens.domain.User;
import com.codelens.domain.UserRole;
import com.codelens.dto.AssignmentResponse;
import com.codelens.dto.CreateAssignmentRequest;
import com.codelens.exception.ApiExceptions;
import com.codelens.repository.AssignmentRepository;

@Service
public class AssignmentService {

	private final AssignmentRepository assignmentRepository;
	private final UserService userService;

	public AssignmentService(AssignmentRepository assignmentRepository, UserService userService) {
		this.assignmentRepository = assignmentRepository;
		this.userService = userService;
	}

	@Transactional
	public AssignmentResponse create(CreateAssignmentRequest request) {
		User professor = userService.requireUser(request.professorId());
		if (professor.getRole() != UserRole.PROFESSOR) {
			throw ApiExceptions.badRequest(
					"INVALID_ROLE",
					"User " + professor.getId() + " is not a PROFESSOR"
			);
		}
		Assignment assignment = assignmentRepository.save(new Assignment(
				request.title().trim(),
				request.description().trim(),
				request.dueDate(),
				professor
		));
		return AssignmentResponse.from(assignment);
	}

	@Transactional(readOnly = true)
	public AssignmentResponse getById(Long id) {
		return AssignmentResponse.from(requireAssignment(id));
	}

	@Transactional(readOnly = true)
	public List<AssignmentResponse> list() {
		return assignmentRepository.findAll().stream()
				.map(AssignmentResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public Assignment requireAssignment(Long id) {
		return assignmentRepository.findById(id)
				.orElseThrow(() -> ApiExceptions.notFound(
						"ASSIGNMENT_NOT_FOUND",
						"Assignment " + id + " was not found"
				));
	}
}
