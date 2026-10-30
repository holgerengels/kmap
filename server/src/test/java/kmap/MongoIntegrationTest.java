package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class MongoIntegrationTest {
    private static Couch couch;
    private static Tests tests;
    private static States states;
    private static Courses courses;
    private static Feedback feedback;
    private static CouchDBAuthConnection auth;
    private static Instances instances;
    private static ContentManager contentManager;

    @BeforeAll
    public static void setup() {
        Properties props = new Properties();
        props.setProperty("mongo.host", "localhost");
        props.setProperty("mongo.port", "27017");
        props.setProperty("mongo.user", "admin");
        props.setProperty("mongo.password", "password");
        props.setProperty("mongo.db", "kmap");

        Server.CLIENT.set("root");

        couch = new Couch(props);
        tests = new Tests(couch);
        states = new States(couch);
        courses = new Courses(states);
        feedback = new Feedback(couch);
        auth = new CouchDBAuthConnection(props);
        instances = Instances.get(props);
        contentManager = new ContentManager(props);
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
        states.delete(testUser);
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

        String resetToken = auth.createResetToken(testId + "@example.com");
        assertNotNull(resetToken, "Reset token should be created");
        assertTrue(auth.resetPassword(resetToken, "NewPass456!"), "Password reset should succeed");
        assertNotNull(auth.doauthenticate(testId, "NewPass456!"), "Authentication with new password should succeed");

        auth.deleteUser(testId);
        Set<String> deletedRoles = auth.doauthenticate(testId, "NewPass456!");
        assertNull(deletedRoles, "Authentication for deleted user should fail");
    }

    @Test
    public void testInstancesDAO() {
        JsonArray list = instances.instances();
        assertNotNull(list);
        assertTrue(list.size() >= 3, "Should have root, merian-schule, and vu instances");
        System.out.println("Instances: " + list);
    }

    @Test
    public void testCardCrudRenameAndModuleExportImport() throws Exception {
        String testInst = "test-inst-" + System.currentTimeMillis();
        Server.CLIENT.set(testInst);
        Path tmpFile = Files.createTempFile("card-att-", ".png");
        try {
            byte[] fileBytes = new byte[]{1, 2, 3, 4, 5, 6, 7, 8};
            Files.write(tmpFile, fileBytes);
            Map<String, Upload> uploads = new HashMap<>();
            uploads.put("diagram.png", new Upload("diagram.png", "image/png", tmpFile));

            // 1. Create card with attachment
            String createJson = "{\"changed\":{\"subject\":\"Mathematik\",\"module\":\"TestModul\",\"chapter\":\"Kap1\",\"topic\":\"Top1\",\"summary\":\"Sum1\",\"description\":\"Desc1\",\"attachments\":[{\"type\":\"file\",\"name\":\"diagram.png\",\"file\":\"diagram.png\",\"mime\":\"image/png\"}]}}";
            String res = couch.storeTopic("Mathematik", "TestModul", createJson, uploads);
            assertEquals("reload:", res);

            JsonObject loaded = couch.loadTopic("Mathematik", "Kap1", "Top1");
            assertNotNull(loaded);
            assertEquals("Sum1", loaded.get("summary").getAsString());
            assertEquals(1, loaded.getAsJsonArray("attachments").size());

            ByteArrayOutputStream attBytes = new ByteArrayOutputStream();
            assertTrue(couch.loadAttachment(att -> {
                try { att.stream.transferTo(attBytes); } catch (Exception e) { throw new RuntimeException(e); }
            }, "Mathematik", "Kap1", "Top1", "diagram.png"));
            assertArrayEquals(fileBytes, attBytes.toByteArray());

            // 2. Update card
            String updateJson = "{\"old\":{\"chapter\":\"Kap1\",\"topic\":\"Top1\"},\"changed\":{\"subject\":\"Mathematik\",\"module\":\"TestModul\",\"chapter\":\"Kap1\",\"topic\":\"Top1\",\"summary\":\"SumUpdated\",\"description\":\"DescUpdated\",\"attachments\":[{\"type\":\"file\",\"name\":\"diagram.png\",\"file\":\"diagram.png\",\"mime\":\"image/png\"}]}}";
            assertEquals("reload:", couch.storeTopic("Mathematik", "TestModul", updateJson, Collections.emptyMap()));
            assertEquals("SumUpdated", couch.loadTopic("Mathematik", "Kap1", "Top1").get("summary").getAsString());

            // 3. Rename card and verify attachment slug follows rename
            String renameJson = "{\"rename\":{\"chapter\":\"Kap1\",\"topic\":\"Top1\"},\"newChapter\":\"Kap1\",\"newTopic\":\"TopRenamed\"}";
            assertEquals("reload:", couch.storeTopic("Mathematik", "TestModul", renameJson, Collections.emptyMap()));
            assertNull(couch.loadTopic("Mathematik", "Kap1", "Top1"));
            assertNotNull(couch.loadTopic("Mathematik", "Kap1", "TopRenamed"));
            assertFalse(couch.loadAttachment(att -> {}, "Mathematik", "Kap1", "Top1", "diagram.png"));
            assertTrue(couch.loadAttachment(att -> {}, "Mathematik", "Kap1", "TopRenamed", "diagram.png"));

            // 4. Move card to another module
            String moveJson = "{\"move\":{\"chapter\":\"Kap1\",\"topic\":\"TopRenamed\"},\"module\":\"MovedModul\"}";
            assertEquals("reload:", couch.storeTopic("Mathematik", "TestModul", moveJson, Collections.emptyMap()));
            assertEquals("MovedModul", couch.loadTopic("Mathematik", "Kap1", "TopRenamed").get("module").getAsString());

            // 5. Export module as ZIP (including binary attachment), delete module, re-import ZIP, and verify card + binary attachment
            ByteArrayOutputStream zipOut = new ByteArrayOutputStream();
            contentManager.exportModule("Mathematik", "MovedModul", zipOut);
            byte[] zipData = zipOut.toByteArray();
            assertTrue(zipData.length > 0);

            JsonObject delRes = couch.deleteModule("Mathematik", "MovedModul");
            assertEquals(1, delRes.get("count").getAsInt());
            assertNull(couch.loadTopic("Mathematik", "Kap1", "TopRenamed"));
            assertFalse(couch.loadAttachment(att -> {}, "Mathematik", "Kap1", "TopRenamed", "diagram.png"));

            contentManager.importModule(new ByteArrayInputStream(zipData));
            JsonObject reimported = couch.loadTopic("Mathematik", "Kap1", "TopRenamed");
            assertNotNull(reimported);
            assertEquals("SumUpdated", reimported.get("summary").getAsString());
            assertEquals(1, reimported.getAsJsonArray("attachments").size());

            ByteArrayOutputStream reimportedAtt = new ByteArrayOutputStream();
            assertTrue(couch.loadAttachment(att -> {
                try { att.stream.transferTo(reimportedAtt); } catch (Exception e) { throw new RuntimeException(e); }
            }, "Mathematik", "Kap1", "TopRenamed", "diagram.png"));
            assertArrayEquals(fileBytes, reimportedAtt.toByteArray());

            // 6. Delete card via storeTopic
            String deleteJson = "{\"delete\":{\"chapter\":\"Kap1\",\"topic\":\"TopRenamed\"}}";
            assertTrue(couch.storeTopic("Mathematik", "MovedModul", deleteJson, Collections.emptyMap()).startsWith("delete:"));
            assertNull(couch.loadTopic("Mathematik", "Kap1", "TopRenamed"));
            assertFalse(couch.loadAttachment(att -> {}, "Mathematik", "Kap1", "TopRenamed", "diagram.png"));
        } finally {
            Files.deleteIfExists(tmpFile);
            instances.dropInstance(testInst);
            Server.CLIENT.set("root");
        }
    }

    @Test
    public void testTestCrudRenameAndSetExportImport() throws Exception {
        String testInst = "test-inst-tests-" + System.currentTimeMillis();
        Server.CLIENT.set(testInst);
        Path tmpFile = Files.createTempFile("test-att-", ".svg");
        try {
            byte[] svgBytes = "<svg xmlns=\"http://www.w3.org/2000/svg\"/>".getBytes(StandardCharsets.UTF_8);
            Files.write(tmpFile, svgBytes);
            Map<String, Upload> uploads = new HashMap<>();
            uploads.put("hint.svg", new Upload("hint.svg", "image/svg+xml", tmpFile));

            // 1. Create test with attachment
            String createJson = "{\"changed\":{\"set\":\"Set1\",\"subject\":\"Mathematik\",\"chapter\":\"Kap1\",\"topic\":\"Top1\",\"key\":\"Aufgabe1\",\"question\":\"Was ist 1+1?\",\"answer\":\"2\",\"hint\":\"<img src=\\\"inline:hint.svg\\\"/>\",\"attachments\":[{\"type\":\"file\",\"name\":\"hint.svg\",\"file\":\"hint.svg\",\"mime\":\"image/svg+xml\"}]}}";
            assertEquals("reload:", tests.storeTest("Mathematik", "Set1", createJson, uploads));

            // Verify attachments array is preserved across all load methods!
            JsonObject loadedKey = tests.loadTestByKey("Mathematik", "Kap1", "Top1", "Aufgabe1");
            assertNotNull(loadedKey);
            assertEquals(1, loadedKey.getAsJsonArray("attachments").size(), "loadTestByKey must preserve attachments array");
            assertEquals("hint.svg", loadedKey.getAsJsonArray("attachments").get(0).getAsJsonObject().get("file").getAsString());

            JsonArray bySet = tests.loadTestsBySet("Mathematik", "Set1");
            assertEquals(1, bySet.size());
            assertEquals(1, bySet.get(0).getAsJsonObject().getAsJsonArray("attachments").size(), "loadTestsBySet must preserve attachments array");

            JsonArray byChapter = tests.loadTestsByChapter("Mathematik", "Kap1");
            assertEquals(1, byChapter.get(0).getAsJsonObject().getAsJsonArray("attachments").size(), "loadTestsByChapter must preserve attachments array");

            JsonArray byTopic = tests.loadTestsByTopic("Mathematik", "Kap1", "Top1");
            assertEquals(1, byTopic.get(0).getAsJsonObject().getAsJsonArray("attachments").size(), "loadTestsByTopic must preserve attachments array");

            ByteArrayOutputStream attBytes = new ByteArrayOutputStream();
            assertTrue(tests.loadAttachment(att -> {
                try { att.stream.transferTo(attBytes); } catch (Exception e) { throw new RuntimeException(e); }
            }, "Mathematik", "Set1", "Aufgabe1", "hint.svg"));
            assertArrayEquals(svgBytes, attBytes.toByteArray());

            // 2. Rename test and verify attachment slug follows rename
            String renameJson = "{\"rename\":{\"chapter\":\"Kap1\",\"topic\":\"Top1\",\"key\":\"Aufgabe1\"},\"name\":\"AufgabeRenamed\"}";
            assertEquals("reload:", tests.storeTest("Mathematik", "Set1", renameJson, Collections.emptyMap()));
            assertNull(tests.loadTestByKey("Mathematik", "Kap1", "Top1", "Aufgabe1"));
            assertNotNull(tests.loadTestByKey("Mathematik", "Kap1", "Top1", "AufgabeRenamed"));
            assertFalse(tests.loadAttachment(att -> {}, "Mathematik", "Set1", "Aufgabe1", "hint.svg"));
            assertTrue(tests.loadAttachment(att -> {}, "Mathematik", "Set1", "AufgabeRenamed", "hint.svg"));

            // 3. Export test set as ZIP (including binary attachment), delete set, re-import ZIP, and verify test + binary attachment
            ByteArrayOutputStream zipOut = new ByteArrayOutputStream();
            contentManager.exportSet("Mathematik", "Set1", zipOut);
            byte[] zipData = zipOut.toByteArray();
            assertTrue(zipData.length > 0);

            JsonObject delSet = tests.deleteSet("Mathematik", "Set1");
            assertEquals(1, delSet.get("count").getAsInt());
            assertNull(tests.loadTestByKey("Mathematik", "Kap1", "Top1", "AufgabeRenamed"));
            assertFalse(tests.loadAttachment(att -> {}, "Mathematik", "Set1", "AufgabeRenamed", "hint.svg"));

            contentManager.importSet(new ByteArrayInputStream(zipData));
            JsonObject reimported = tests.loadTestByKey("Mathematik", "Kap1", "Top1", "AufgabeRenamed");
            assertNotNull(reimported);
            assertEquals(1, reimported.getAsJsonArray("attachments").size());

            ByteArrayOutputStream reimportedAtt = new ByteArrayOutputStream();
            assertTrue(tests.loadAttachment(att -> {
                try { att.stream.transferTo(reimportedAtt); } catch (Exception e) { throw new RuntimeException(e); }
            }, "Mathematik", "Set1", "AufgabeRenamed", "hint.svg"));
            assertArrayEquals(svgBytes, reimportedAtt.toByteArray());

            // 4. Delete test via storeTest
            String deleteJson = "{\"delete\":{\"chapter\":\"Kap1\",\"topic\":\"Top1\",\"key\":\"AufgabeRenamed\"}}";
            assertTrue(tests.storeTest("Mathematik", "Set1", deleteJson, Collections.emptyMap()).startsWith("delete:"));
            assertNull(tests.loadTestByKey("Mathematik", "Kap1", "Top1", "AufgabeRenamed"));
            assertFalse(tests.loadAttachment(att -> {}, "Mathematik", "Set1", "AufgabeRenamed", "hint.svg"));
        } finally {
            Files.deleteIfExists(tmpFile);
            instances.dropInstance(testInst);
            Server.CLIENT.set("root");
        }
    }

    @Test
    public void testCoursesAndFeedbackDAO() {
        String testInst = "test-inst-cf-" + System.currentTimeMillis();
        Server.CLIENT.set(testInst);
        try {
            // Courses CRUD & timelines
            String courseJson = "{\"name\":\"Kurs10a\",\"subject\":\"Mathematik\",\"curriculum\":\"Analysis\",\"students\":[\"alice\",\"bob\"]}";
            courses.saveCourse("teacher1", "Kurs10a", courseJson);

            JsonArray teacherCourses = courses.courses("teacher1");
            assertEquals(1, teacherCourses.size());
            assertEquals("Kurs10a", teacherCourses.get(0).getAsJsonObject().get("name").getAsString());

            JsonArray studentTimelines = courses.timelines("alice");
            assertEquals(1, studentTimelines.size());

            courses.deleteCourse("teacher1", "{\"name\":\"Kurs10a\"}");
            assertEquals(0, courses.courses("teacher1").size());

            // Feedback submit, load, resolve
            feedback.submit("alice", "{\"subject\":\"Mathematik\",\"chapter\":\"Analysis\",\"type\":\"content\",\"title\":\"Tippfehler\",\"text\":\"Bitte korrigieren\"}");
            feedback.bug("{\"title\":\"UI Bug\",\"text\":\"Button klemmt\"}");

            List<JsonObject> openFeedback = feedback.load("open");
            assertEquals(2, openFeedback.size());

            for (JsonObject fb : openFeedback) {
                feedback.resolve(fb.toString());
            }
            assertEquals(0, feedback.load("open").size());
        } finally {
            instances.dropInstance(testInst);
            Server.CLIENT.set("root");
        }
    }
}
