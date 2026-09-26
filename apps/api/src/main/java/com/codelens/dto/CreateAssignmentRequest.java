package com.codelens.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAssignmentRequest(
		@NotBlank @Size(max = 255) String title,
		@NotBlank String description,
		@NotNull LocalDateTime dueDate,
		@NotNull Long professorId
) {
}
