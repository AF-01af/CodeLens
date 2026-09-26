package com.codelens.dto;

import com.codelens.domain.ReviewStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateReviewRequest(
		@NotNull Long reviewerId,
		@NotBlank String content,
		@NotNull ReviewStatus status
) {
}
