package com.codelens.dto;

import java.time.LocalDateTime;

import com.codelens.domain.User;
import com.codelens.domain.UserRole;

public record UserResponse(
		Long id,
		String name,
		String email,
		UserRole role,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static UserResponse from(User user) {
		return new UserResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getRole(),
				user.getCreatedAt(),
				user.getUpdatedAt()
		);
	}
}
