package com.codelens.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codelens.domain.User;
import com.codelens.dto.CreateUserRequest;
import com.codelens.dto.UserResponse;
import com.codelens.exception.ApiExceptions;
import com.codelens.repository.UserRepository;

@Service
public class UserService {

	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional
	public UserResponse create(CreateUserRequest request) {
		String email = request.email().trim().toLowerCase();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw ApiExceptions.conflict("DUPLICATE_EMAIL", "Email already exists: " + email);
		}
		User user = userRepository.save(new User(request.name().trim(), email, request.role()));
		return UserResponse.from(user);
	}

	@Transactional(readOnly = true)
	public UserResponse getById(Long id) {
		return UserResponse.from(requireUser(id));
	}

	@Transactional(readOnly = true)
	public User requireUser(Long id) {
		return userRepository.findById(id)
				.orElseThrow(() -> ApiExceptions.notFound("USER_NOT_FOUND", "User " + id + " was not found"));
	}
}
