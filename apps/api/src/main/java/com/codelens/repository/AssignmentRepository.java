package com.codelens.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codelens.domain.Assignment;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
}
