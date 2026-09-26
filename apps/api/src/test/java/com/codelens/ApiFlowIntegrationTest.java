package com.codelens;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
class ApiFlowIntegrationTest {

	@Autowired
	private WebApplicationContext webApplicationContext;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
	}

	@Test
	void fullPeerReviewFlowAndSelfReviewRejected() throws Exception {
		long professorId = createUser("Prof Ada", "ada@example.com", "PROFESSOR");
		long studentAId = createUser("Student A", "a@example.com", "STUDENT");
		long studentBId = createUser("Student B", "b@example.com", "STUDENT");

		MvcResult assignmentResult = mockMvc.perform(post("/api/assignments")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Linked List Assignment",
								  "description": "Implement a singly linked list.",
								  "dueDate": "2099-10-15T23:59:00",
								  "professorId": %d
								}
								""".formatted(professorId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.title").value("Linked List Assignment"))
				.andExpect(jsonPath("$.professorId").value((int) professorId))
				.andReturn();

		long assignmentId = readId(assignmentResult);

		mockMvc.perform(post("/api/assignments")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Should Fail",
								  "description": "Students cannot create assignments.",
								  "dueDate": "2099-10-15T23:59:00",
								  "professorId": %d
								}
								""".formatted(studentAId)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("INVALID_ROLE"));

		MvcResult submissionResult = mockMvc.perform(post("/api/assignments/%d/submissions".formatted(assignmentId))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "studentId": %d,
								  "code": "public class LinkedList {}"
								}
								""".formatted(studentAId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.studentId").value((int) studentAId))
				.andExpect(jsonPath("$.code").value("public class LinkedList {}"))
				.andReturn();

		long submissionId = readId(submissionResult);

		mockMvc.perform(post("/api/submissions/%d/reviews".formatted(submissionId))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "reviewerId": %d,
								  "content": "Looks fine so far.",
								  "status": "SUBMITTED"
								}
								""".formatted(studentBId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.reviewerId").value((int) studentBId))
				.andExpect(jsonPath("$.status").value("SUBMITTED"));

		mockMvc.perform(post("/api/submissions/%d/reviews".formatted(submissionId))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "reviewerId": %d,
								  "content": "I should not review myself.",
								  "status": "SUBMITTED"
								}
								""".formatted(studentAId)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("SELF_REVIEW_NOT_ALLOWED"));

		mockMvc.perform(get("/api/submissions/%d".formatted(submissionId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value((int) submissionId));

		mockMvc.perform(get("/api/submissions/%d/reviews".formatted(submissionId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].reviewerId").value((int) studentBId));
	}

	@Test
	void missingResourceReturns404() throws Exception {
		mockMvc.perform(get("/api/users/999999"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error.code").value("USER_NOT_FOUND"));
	}

	@Test
	void invalidRequestBodyReturns400() throws Exception {
		mockMvc.perform(post("/api/users")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "",
								  "email": "not-an-email",
								  "role": "STUDENT"
								}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.error.message", containsString("email")));
	}

	@Test
	void duplicateEmailReturns409() throws Exception {
		createUser("First", "dup@example.com", "STUDENT");
		mockMvc.perform(post("/api/users")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Second",
								  "email": "dup@example.com",
								  "role": "STUDENT"
								}
								"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error.code").value("DUPLICATE_EMAIL"));
	}

	private long createUser(String name, String email, String role) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/users")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "%s",
								  "email": "%s",
								  "role": "%s"
								}
								""".formatted(name, email, role)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.email").value(email.toLowerCase()))
				.andExpect(jsonPath("$.role").value(role))
				.andReturn();
		return readId(result);
	}

	private static long readId(MvcResult result) throws Exception {
		Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
		return id.longValue();
	}
}
