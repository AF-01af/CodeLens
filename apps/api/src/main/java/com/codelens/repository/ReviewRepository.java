package com.codelens.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codelens.domain.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	List<Review> findBySubmissionIdOrderByCreatedAtAsc(Long submissionId);

	boolean existsBySubmissionIdAndReviewerId(Long submissionId, Long reviewerId);
}
