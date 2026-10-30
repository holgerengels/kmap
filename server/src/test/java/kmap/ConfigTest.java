package kmap;

import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;

public class ConfigTest {

    @Test
    public void flattensServerSection() {
        Properties properties = Config.fromJson(JsonParser.parseString("""
                {
                  "server": {
                    "cors": true,
                    "mongo": { "uri": "mongodb://u:p@mongodb:27017/?authSource=admin", "db": "kmap", "port": 27017 },
                    "auth": { "authenticate": false, "type": "paedml" },
                    "mail": { "smtp": { "host": "smtp.example.org", "starttls": true }, "base-url": "https://kmap.eu" },
                    "paedml": { "groups": ["a", "b"] },
                    "ignored": null
                  },
                  "snappy": { "port": 8090 }
                }
                """));

        assertEquals("true", properties.getProperty("cors"));
        assertEquals("mongodb://u:p@mongodb:27017/?authSource=admin", properties.getProperty("mongo.uri"));
        assertEquals("kmap", properties.getProperty("mongo.db"));
        assertEquals("27017", properties.getProperty("mongo.port"));
        assertEquals("false", properties.getProperty("auth.authenticate"));
        assertEquals("paedml", properties.getProperty("auth.type"));
        assertEquals("smtp.example.org", properties.getProperty("mail.smtp.host"));
        assertEquals("true", properties.getProperty("mail.smtp.starttls"));
        assertEquals("https://kmap.eu", properties.getProperty("mail.base-url"));
        assertEquals("a,b", properties.getProperty("paedml.groups"));
        assertNull(properties.getProperty("ignored"));
        assertNull(properties.getProperty("port"), "snappy section must not leak into server config");
        assertNull(properties.getProperty("snappy.port"));
    }

    @Test
    public void withoutSectionTheRootObjectIsUsed() {
        Properties properties = Config.fromJson(JsonParser.parseString("{\"mongo\": {\"db\": \"test\"}}"));
        assertEquals("test", properties.getProperty("mongo.db"));
    }

    @Test
    public void rejectsNonObjects() {
        assertThrows(IllegalArgumentException.class, () -> Config.fromJson(JsonParser.parseString("[]")));
        assertThrows(IllegalArgumentException.class, () -> Config.fromJson(JsonParser.parseString("{\"server\": 1}")));
    }

    @Test
    public void defaultsPathsToConfigDirectory(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("config.json");
        Files.writeString(file, "{\"server\": {\"auth\": {\"authenticate\": true}}}");

        Properties properties = Config.load(file);
        assertEquals("true", properties.getProperty("auth.authenticate"));
        assertEquals(dir.toAbsolutePath().toString(), properties.getProperty("config.dir"));
        assertEquals(dir.toAbsolutePath() + "/", properties.getProperty("auth.csv"));
        assertEquals(dir.toAbsolutePath().resolve("trustStore").toString(), properties.getProperty("auth.trustStore"));
    }

    @Test
    public void explicitPathsAreKept(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("config.json");
        Files.writeString(file, "{\"server\": {\"auth\": {\"csv\": \"/srv/auth/\", \"trustStore\": \"/srv/ts\"}}}");

        Properties properties = Config.load(file);
        assertEquals("/srv/auth/", properties.getProperty("auth.csv"));
        assertEquals("/srv/ts", properties.getProperty("auth.trustStore"));
    }

    @Test
    public void legacyPropertiesFilesStillWorkForCommandLineTools(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("kmap.properties");
        Files.writeString(file, "mongo.db=legacy\n");

        assertEquals("legacy", Config.load(file.toString()).getProperty("mongo.db"));
    }

    @Test
    public void missingFileGivesHelpfulError() {
        String before = System.getProperty(Config.SYSTEM_PROPERTY);
        System.setProperty(Config.SYSTEM_PROPERTY, "/does/not/exist/config.json");
        try {
            IOException e = assertThrows(IOException.class, Config::resolve);
            assertTrue(e.getMessage().contains("/does/not/exist/config.json"));
        }
        finally {
            if (before == null)
                System.clearProperty(Config.SYSTEM_PROPERTY);
            else
                System.setProperty(Config.SYSTEM_PROPERTY, before);
        }
    }
}
