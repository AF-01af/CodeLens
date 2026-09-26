package com.codelens.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codelens.domain.User;

public interface UserRepository extends JpaRepository<User, Long> {

	boolean existsByEmailIgnoreCase(String email);

	Optional<User> findByEmailIgnoreCase(String email);
}
