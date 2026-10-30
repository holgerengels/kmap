package kmap;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class AuthenticationTest {

    @Test
    public void handlesCsvWithTrailingNewlineAndEmptyLines(@TempDir Path tempDir) throws IOException {
        Path csvPath = tempDir.resolve("root-users.csv");
        Files.writeString(csvPath, "admin,--,teacher,admin\n\n");

        Properties props = new Properties();
        props.setProperty("auth.csv", tempDir.toString() + "/");
        props.setProperty("auth.authenticate", "false");

        Server.CLIENT.set("root");
        try {
            Authentication auth = new Authentication(props);
            Set<String> roles = auth.authenticate("admin", "admin");
            assertNotNull(roles);
            assertTrue(roles.contains("admin"));
            assertTrue(roles.contains("teacher"));
        } finally {
            Server.CLIENT.remove();
        }
    }
}
