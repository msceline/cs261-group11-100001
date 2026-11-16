package com.team.project;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

// Loads the whole app, so it needs a real SQL Server (MSSQL_SA_PASSWORD, DB_PORT, DB_NAME); skipped without one.
@SpringBootTest(properties = "jwt.secret=test-secret-test-secret-test-secret")
@EnabledIfEnvironmentVariable(named = "MSSQL_SA_PASSWORD", matches = ".+")
class ProjectApplicationTests {

	@Test
	void contextLoads() {
	}

}
