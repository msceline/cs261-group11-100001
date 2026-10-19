package com.team.project;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "jwt.secret=test-secret-test-secret-test-secret")
class ProjectApplicationTests {

	@Test
	void contextLoads() {
	}

}
