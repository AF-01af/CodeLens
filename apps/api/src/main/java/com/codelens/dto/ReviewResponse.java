package com.codelens.dto;

import java.time.LocalDateTime;

import com.codelens.domain.Review;
import com.codelens.domain.ReviewStatus;

public record ReviewResponse(
		Long id,
		Long submissionId,
		Long reviewerId,
		String content,
		ReviewStatus status,
		LocalDateTime submittedAt,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static ReviewResponse from(Review review) {
		return new ReviewResponse(
				review.getId(),
				review.getSubmission().getId(),
				review.getReviewer().getId(),
				review.getContent(),
				review.getStatus(),
				review.getSubmittedAt(),
				review.getCreatedAt(),
				review.getUpdatedAt()
		);
	}
}
