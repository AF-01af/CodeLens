package com.codelens.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codelens.domain.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

	List<Submission> findByAssignmentIdOrderBySubmittedAtAsc(Long assignmentId);

	boolean existsByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
}
