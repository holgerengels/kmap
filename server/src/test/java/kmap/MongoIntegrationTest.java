package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class MongoIntegrationTest {
    private static Couch couch;
    private static Tests tests;
    private static States states;
    private static Courses courses;
    private static Feedback feedback;
    private static CouchDBAuthConnection auth;
    private static Instances instances;

    @BeforeAll
    public static void setup() {
        Properties props = new Properties();
        props.setProperty("kmap.mongo.host", "localhost");
        props.setProperty("kmap.mongo.port", "27017");
        props.setProperty("kmap.mongo.user", "admin");
        props.setProperty("kmap.mongo.password", "password");
        props.setProperty("kmap.mongo.db", "kmap");

        Server.CLIENT.set("root");

        couch = new Couch(props);
        tests = new Tests(couch);
        states = new States(couch);
        courses = new Courses(states);
        feedback = new Feedback(couch);
        auth = new CouchDBAuthConnection(props);
        instances = Instances.get(props);
    }

    @AfterAll
    public static void teardown() {
        Server.CLIENT.remove();
        MongoConnection.close();
    }

    @Test
    public void testLoadSubjectsAndModules() {
        JsonArray subjects = couch.loadSubjects();
        assertNotNull(subjects);
        assertTrue(subjects.size() > 0, "Should have loaded subjects");
        System.out.println("Loaded subjects: " + subjects);

        JsonArray modules = couch.loadModules();
        assertNotNull(modules);
        assertTrue(modules.size() > 0, "Should have loaded modules");
        System.out.println("Loaded modules count: " + modules.size());
    }

    @Test
    public void testLoadChaptersAndTopics() {
        JsonArray chapters = couch.chapters("Mathematik");
        assertNotNull(chapters);
        assertTrue(chapters.size() > 0, "Should have chapters for Mathematik");
        System.out.println("Mathematik chapters: " + chapters);

        JsonArray topics = couch.topics("Mathematik");
        assertNotNull(topics);
        assertTrue(topics.size() > 0, "Should have topics for Mathematik");
    }

    @Test
    public void testChapterBoard() {
        JsonArray chapters = couch.chapters("Mathematik");
        String firstChapter = chapters.get(0).getAsString();
        JsonObject board = couch.chapter("Mathematik", firstChapter, true);
        assertNotNull(board);
        assertEquals("Mathematik", board.get("subject").getAsString());
        assertEquals(firstChapter, board.get("chapter").getAsString());
        assertTrue(board.has("lines"));
        System.out.println("Board for " + firstChapter + " lines: " + board.getAsJsonArray("lines").size());
    }

    @Test
    public void testLoadTopicAndAttachment() throws Exception {
        Server.CLIENT.set("merian-schule");
        try {
            JsonObject topic = couch.loadTopic("Hilfe", "Hilfe", "Lernfortschritt");
            assertNotNull(topic, "Topic Lernfortschritt should exist");
            assertEquals("Hilfe", topic.get("subject").getAsString());
            assertEquals("Lernfortschritt", topic.get("topic").getAsString());

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            boolean found = couch.loadAttachment(att -> {
                try (InputStream in = att.stream) {
                    in.transferTo(out);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }, "Hilfe", "Hilfe", "Lernfortschritt", "Lernfortschritt.png");

            assertTrue(found, "Attachment Lernfortschritt.png should be found");
            assertTrue(out.size() > 0, "Attachment content should not be empty");
            System.out.println("Successfully loaded attachment Lernfortschritt.png: " + out.size() + " bytes");
        } finally {
            Server.CLIENT.set("root");
        }
    }

    @Test
    public void testLinksAndDeps() {
        Map<String, String> links = couch.links("Mathematik");
        assertNotNull(links);
        System.out.println("Mathematik links count: " + links.size());

        MultiMap<String, String> deps = couch.deps("Mathematik");
        assertNotNull(deps);
        System.out.println("Mathematik deps count: " + deps.size());
    }

    @Test
    public void testTestsDAO() {
        JsonArray sets = tests.loadSets();
        assertNotNull(sets);
        System.out.println("Test sets count: " + sets.size());

        JsonArray chapters = tests.loadChapters("Mathematik");
        assertNotNull(chapters);
        System.out.println("Test chapters for Mathematik: " + chapters.size());
    }

    @Test
    public void testStatesDAO() {
        String testUser = "integration_test_user";
        JsonObject initial = states.states(testUser, "Mathematik");
        assertNotNull(initial);

        JsonObject stored = states.store(testUser, "Mathematik", "{\"id\": \"Analysis.Differentialrechnung\", \"rate\": 3}");
        assertNotNull(stored);

        states.delete(testUser);
        JsonObject afterDelete = states.states(testUser, "Mathematik");
        assertFalse(afterDelete.has("Analysis.Differentialrechnung"));
    }

    @Test
    public void testAuthDAO() {
        String testId = "temp_user_test_" + System.currentTimeMillis();
        JsonObject created = auth.register(testId, testId + "@example.com", "SecretPass123!", "Test User");
        assertNotNull(created, "User registration should succeed");

        Set<String> roles = auth.doauthenticate(testId, "SecretPass123!");
        assertNotNull(roles, "Authentication should succeed");
        assertTrue(roles.contains("user"));

        Set<String> badRoles = auth.doauthenticate(testId, "WrongPassword");
        assertNull(badRoles, "Authentication with wrong password should fail");

        auth.deleteUser(testId);
        Set<String> deletedRoles = auth.doauthenticate(testId, "SecretPass123!");
        assertNull(deletedRoles, "Authentication for deleted user should fail");
    }

    @Test
    public void testInstancesDAO() {
        JsonArray list = instances.instances();
        assertNotNull(list);
        assertTrue(list.size() >= 3, "Should have root, merian-schule, and vu instances");
        System.out.println("Instances: " + list);
    }
}
