package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.lightcouch.CouchDbClient;
import org.lightcouch.Response;
import org.lightcouch.View;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;

import static kmap.JSON.*;

public class Tests {
    private Couch couch;

    public Tests(Couch couch) {
        this.couch = couch;
    }

    private CouchDbClient getClient() {
        return couch.createClient("test");
    }

    public synchronized JsonArray loadSets() {
        View view = getClient().view("test/availableSets")
            .group(true)
            .reduce(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        List<JsonObject> sets = new ArrayList<>();
        objects.forEach(object -> {
            JsonObject set = new JsonObject();
            set.addProperty("subject", object.getAsJsonArray("key").get(0).getAsString());
            set.addProperty("set", object.getAsJsonArray("key").get(1).getAsString());
            set.addProperty("count", object.get("value").getAsNumber());
            sets.add(set);
        });
        sets.sort(Comparator
            .comparing((JsonObject o) -> o.getAsJsonPrimitive("subject").getAsString())
            .thenComparing(o -> o.getAsJsonPrimitive("set").getAsString())
        );
        JsonArray array = new JsonArray();
        sets.forEach(array::add);
        System.out.println("sets = " + array);
        return array;
    }

    public JsonArray loadChapters(String subject) {
        View view = getClient().view("test/chapters")
            .key(subject)
            .reduce(false);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonArray array = new JsonArray();
        objects.stream().map(o -> o.getAsJsonPrimitive("value").getAsString()).distinct().forEach(array::add);
        return array;
    }

    public JsonArray loadTopics(String subject) {
        View view = getClient().view("test/topics")
            .key(subject)
            .reduce(false);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonArray array = new JsonArray();
        objects.stream().map(o -> o.getAsJsonPrimitive("value").getAsString()).distinct().forEach(array::add);
        return array;
    }

    public synchronized JsonArray loadSet(String subject, String set) {
        List<JsonObject> objects = loadSetAsList(subject, set);
        JsonArray array = new JsonArray();
        for (JsonObject object : objects) {
            array.add(object);
        }
        return array;
    }

    private List<JsonObject> loadSetAsList(String subject, String set) {
        try {
            View view = getClient().view("test/bySet")
                .key(subject, set)
                .reduce(false)
                .includeDocs(true);
            List<JsonObject> objects = view.query(JsonObject.class);
            objects.removeIf(o -> string(o, "chapter") == null || string(o, "topic") == null);
            objects.sort(Comparator
                .comparing((JsonObject o) -> o.getAsJsonPrimitive("chapter").getAsString())
                .thenComparing((JsonObject o) -> o.getAsJsonPrimitive("topic").getAsString())
            );
            return objects;
        }
        catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public JsonArray loadChapter(String subject, String chapter) {
        View view = getClient().view("test/byChapter")
            .key(subject, chapter)
            .reduce(false)
            .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonArray array = new JsonArray();
        objects.forEach(array::add);
        return array;
    }

    public JsonArray loadTopic(String subject, String chapter, String topic) {
        View view = getClient().view("test/byChapterTopic")
            .key(subject, chapter, topic)
            .reduce(false)
            .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonArray array = new JsonArray();
        objects.forEach(array::add);
        return array;
    }

    public synchronized String storeTest(String subject, String set, String json) {
        CouchDbClient client = getClient();
        JsonObject object = client.getGson().fromJson(json, JsonObject.class);
        if (object.has("delete")) {                                 // delete
            JsonObject old = (JsonObject)object.get("delete");
            String chapter = string(old, "chapter");
            String topic = string(old, "topic");
            String key = string(old, "key");
            assert chapter != null;
            assert topic != null;
            assert key != null;
            List<JsonObject> array = loadSetAsList(subject, set);
            int pos = -1;
            for (JsonElement element : array) {
                pos++;
                if (equals((JsonObject)element, subject, chapter, topic, key)) {
                    client.remove(element);
                    return "delete:" + pos;
                }
            }
            return "reload:";
        }
        else {
            JsonObject changed = (JsonObject)object.get("changed");

            String command;
            if (object.has("old")) {                                // update
                command = "move:";
                JsonObject old = (JsonObject)object.get("old");
                String chapter = string(old, "chapter");
                String topic = string(old, "topic");
                String key = string(old, "key");
                assert chapter != null;
                assert topic != null;
                assert key != null;
                List<JsonObject> array = loadSetAsList(subject, set);
                for (JsonElement element : array) {
                    JsonObject existing = (JsonObject)element;
                    if (chapter.equals(string(existing, "chapter")) &&
                        topic.equals(string(existing, "topic")) &&
                        key.equals(string(existing, "key"))) {
                        existing.addProperty("subject", subject);
                        existing.add("chapter", changed.get("chapter"));
                        existing.add("topic", changed.get("topic"));
                        existing.add("key", changed.get("key"));
                        existing.add("level", changed.get("level"));
                        existing.add("question", changed.get("question"));
                        existing.add("answer", changed.get("answer"));
                        existing.add("values", changed.get("values"));
                        existing.add("balance", changed.get("balance"));
                        if (checks(changed))
                            client.update(element);
                        else
                            return "error:set, subject, chapter, topic or key missing";
                    }
                }
            }
            else {
                command = "add:";                                               // save
                changed.addProperty("subject", subject);
                changed.remove("added");
                if (checks(changed))
                    client.save(changed);
                else
                    return "error:set, subject, chapter, topic or key missing";
            }

            // determine new position
            String chapter = string(changed, "chapter");
            String topic = string(changed, "topic");
            String key = string(changed, "key");
            assert chapter != null;
            assert topic != null;
            assert key != null;
            List<JsonObject> array = loadSetAsList(subject, set);
            int pos = -1;
            for (JsonElement element : array) {
                pos++;
                if (chapter.equals(string((JsonObject)element, "chapter")) &&
                    topic.equals(string((JsonObject)element, "topic")) &&
                    key.equals(string((JsonObject)element, "key"))) {
                    return command + pos;
                }
            }
            return "reload:";
        }
    }

    private boolean checks(JsonObject object) {
        return !isNull(object, "set") && string(object, "set") != null
            && !isNull(object, "subject") && string(object, "subject") != null
            && !isNull(object, "chapter") && string(object, "chapter") != null
            && !isNull(object, "topic") && string(object, "topic") != null
            && !isNull(object, "key") && string(object, "key") != null;
    }

    private boolean equals(JsonObject element, String subject, String chapter, String topic, String key) {
        return subject.equals(string(element, "subject")) &&
            chapter.equals(string(element, "chapter")) &&
            topic.equals(string(element, "topic")) &&
            key.equals(string(element, "key"))
            ;
    }

    public JsonObject importSet(String subject, String set, String json) {
        CouchDbClient client = getClient();
        JsonObject data = client.getGson().fromJson(json, JsonObject.class);
        System.out.println("data = " + data);
        JsonArray array = (JsonArray)data.get("docs");
        List<JsonObject> newTests = new ArrayList<>();
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            object.addProperty("subject", subject);
            object.addProperty("set", set);
            newTests.add(object);
        }
        List<JsonObject> oldTests = loadSetAsList(subject, set);
        for (JsonObject object : oldTests) {
            object.addProperty("_deleted", true);
        }
        System.out.println("oldTests = " + oldTests);
        System.out.println("newTests = " + newTests);
        client.bulk(oldTests, false);
        client.bulk(newTests, false);

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("set", set);
        object.addProperty("count", newTests.size());
        return object;
    }

    public JsonObject deleteSet(String subject, String set) {
        CouchDbClient client = getClient();
        List<JsonObject> oldTests = loadSetAsList(subject, set);
        for (JsonObject object : oldTests) {
            object.addProperty("_deleted", true);
        }
        System.out.println("oldTests = " + oldTests);
        List<Response> responses = client.bulk(oldTests, false);
        System.out.println("responses = " + responses);

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("set", set);
        object.addProperty("count", oldTests.size());
        return object;
    }

    public static void main(String[] args) throws IOException {
        Server.CLIENT.set("lala");
        Tests tests = new Tests(new Couch(readProperties(args[0])));
        JsonArray topics = tests.loadTopics("Mathematik");
        System.out.println("topics = " + topics);
    }

    private static Properties readProperties(String fileName) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(fileName));
        return properties;
    }
}
