package com.codelens.exception;

import org.springframework.http.HttpStatus;

public final class ApiExceptions {

	private ApiExceptions() {
	}

	public static ApiException notFound(String code, String message) {
		return new ApiException(code, message, HttpStatus.NOT_FOUND.value());
	}

	public static ApiException badRequest(String code, String message) {
		return new ApiException(code, message, HttpStatus.BAD_REQUEST.value());
	}

	public static ApiException conflict(String code, String message) {
		return new ApiException(code, message, HttpStatus.CONFLICT.value());
	}
}
