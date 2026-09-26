package com.codelens.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.codelens.dto.CreateReviewRequest;
import com.codelens.dto.ReviewResponse;
import com.codelens.dto.SubmissionResponse;
import com.codelens.service.ReviewService;
import com.codelens.service.SubmissionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class SubmissionController {

	private final SubmissionService submissionService;
	private final ReviewService reviewService;

	public SubmissionController(SubmissionService submissionService, ReviewService reviewService) {
		this.submissionService = submissionService;
		this.reviewService = reviewService;
	}

	@GetMapping("/submissions/{id}")
	public SubmissionResponse get(@PathVariable Long id) {
		return submissionService.getById(id);
	}

	@PostMapping("/submissions/{submissionId}/reviews")
	@ResponseStatus(HttpStatus.CREATED)
	public ReviewResponse createReview(
			@PathVariable Long submissionId,
			@Valid @RequestBody CreateReviewRequest request
	) {
		return reviewService.create(submissionId, request);
	}

	@GetMapping("/submissions/{submissionId}/reviews")
	public List<ReviewResponse> listReviews(@PathVariable Long submissionId) {
		return reviewService.listForSubmission(submissionId);
	}
}
