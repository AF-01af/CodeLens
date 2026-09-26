package com.codelens.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codelens.domain.Review;
import com.codelens.domain.Submission;
import com.codelens.domain.User;
import com.codelens.domain.UserRole;
import com.codelens.dto.CreateReviewRequest;
import com.codelens.dto.ReviewResponse;
import com.codelens.exception.ApiExceptions;
import com.codelens.repository.ReviewRepository;

@Service
public class ReviewService {

	private final ReviewRepository reviewRepository;
	private final SubmissionService submissionService;
	private final UserService userService;

	public ReviewService(
			ReviewRepository reviewRepository,
			SubmissionService submissionService,
			UserService userService
	) {
		this.reviewRepository = reviewRepository;
		this.submissionService = submissionService;
		this.userService = userService;
	}

	@Transactional
	public ReviewResponse create(Long submissionId, CreateReviewRequest request) {
		Submission submission = submissionService.requireSubmission(submissionId);
		User reviewer = userService.requireUser(request.reviewerId());

		if (reviewer.getRole() != UserRole.STUDENT) {
			throw ApiExceptions.badRequest(
					"INVALID_ROLE",
					"User " + reviewer.getId() + " is not a STUDENT"
			);
		}

		if (submission.getStudent().getId().equals(reviewer.getId())) {
			throw ApiExceptions.badRequest(
					"SELF_REVIEW_NOT_ALLOWED",
					"Reviewer " + reviewer.getId() + " cannot review their own submission"
			);
		}

		if (reviewRepository.existsBySubmissionIdAndReviewerId(submissionId, reviewer.getId())) {
			throw ApiExceptions.conflict(
					"DUPLICATE_REVIEW",
					"Reviewer " + reviewer.getId() + " already reviewed submission " + submissionId
			);
		}

		Review review = reviewRepository.save(new Review(
				submission,
				reviewer,
				request.content().trim(),
				request.status()
		));
		return ReviewResponse.from(review);
	}

	@Transactional(readOnly = true)
	public ReviewResponse getById(Long id) {
		Review review = reviewRepository.findById(id)
				.orElseThrow(() -> ApiExceptions.notFound(
						"REVIEW_NOT_FOUND",
						"Review " + id + " was not found"
				));
		return ReviewResponse.from(review);
	}

	@Transactional(readOnly = true)
	public List<ReviewResponse> listForSubmission(Long submissionId) {
		submissionService.requireSubmission(submissionId);
		return reviewRepository.findBySubmissionIdOrderByCreatedAtAsc(submissionId).stream()
				.map(ReviewResponse::from)
				.toList();
	}
}
