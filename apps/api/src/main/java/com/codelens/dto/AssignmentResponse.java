package com.codelens.dto;

import java.time.LocalDateTime;

import com.codelens.domain.Assignment;

public record AssignmentResponse(
		Long id,
		String title,
		String description,
		LocalDateTime dueDate,
		Long professorId,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static AssignmentResponse from(Assignment assignment) {
		return new AssignmentResponse(
				assignment.getId(),
				assignment.getTitle(),
				assignment.getDescription(),
				assignment.getDueDate(),
				assignment.getProfessor().getId(),
				assignment.getCreatedAt(),
				assignment.getUpdatedAt()
		);
	}
}
