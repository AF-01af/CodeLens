package com.codelens.dto;

import java.time.LocalDateTime;

import com.codelens.domain.Submission;

public record SubmissionResponse(
		Long id,
		Long assignmentId,
		Long studentId,
		String code,
		LocalDateTime submittedAt,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static SubmissionResponse from(Submission submission) {
		return new SubmissionResponse(
				submission.getId(),
				submission.getAssignment().getId(),
				submission.getStudent().getId(),
				submission.getCode(),
				submission.getSubmittedAt(),
				submission.getCreatedAt(),
				submission.getUpdatedAt()
		);
	}
}
