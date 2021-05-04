package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.lightcouch.CouchDbClient;
import org.lightcouch.Response;
import org.lightcouch.View;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.StreamSupport;

import static kmap.JsonServlet.encode;
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
        //System.out.println("sets = " + array);
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
            .startKey(subject, "\u0000")
            .endKey(subject, "\uffff")
            .groupLevel(3)
            .reduce(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonArray array = new JsonArray();
        objects.stream().map(o -> {
            JsonArray key = o.getAsJsonArray("key");
            JsonObject object = new JsonObject();
            object.addProperty("chapter", key.get(1).getAsString());
            object.addProperty("topic", key.get(2).getAsString());
            object.addProperty("count", o.get("value").getAsNumber());
            return object;
        }).distinct().forEach(array::add);
        return array;
    }

    public synchronized JsonArray loadTestsBySet(String subject, String set) {
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
            objects.forEach(o -> {
                JsonObject _attachments = o.getAsJsonObject("_attachments");
                o.add("attachments", amendAttachments(_attachments));
                //o.remove("_attachments");
            });
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

    public JsonArray loadTestsByChapter(String subject, String chapter) {
        View view = getClient().view("test/byChapter")
            .key(subject, chapter)
            .reduce(false)
            .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        objects.forEach(o -> {
            JsonObject _attachments = o.getAsJsonObject("_attachments");
            o.add("attachments", amendAttachments(_attachments));
        });
        JsonArray array = new JsonArray();
        objects.forEach(array::add);
        return array;
    }

    public JsonArray loadTestsByTopic(String subject, String chapter, String topic) {
        View view = getClient().view("test/byChapterTopic")
            .key(subject, chapter, topic)
            .reduce(false)
            .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        objects.forEach(o -> {
            JsonObject _attachments = o.getAsJsonObject("_attachments");
            o.add("attachments", amendAttachments(_attachments));
        });
        JsonArray array = new JsonArray();
        objects.forEach(array::add);
        return array;
    }

    public JsonObject loadTestByKey(String subject, String chapter, String topic, String key) {
        View view = getClient().view("test/byChapterTopicKey")
            .key(subject, chapter, topic, key)
            .reduce(false)
            .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonObject object = objects.get(0);
        JsonObject _attachments = object.getAsJsonObject("_attachments");
        object.add("attachments", amendAttachments(_attachments));
        return object;
    }

    public JsonArray loadRandomTests(String subject) {
        JsonArray topics = loadTopics(subject);
        if (topics.size() < 3)
            return topics;
        JsonObject object = (JsonObject) topics.get(new Random().nextInt(topics.size()));
        JsonArray array = loadTestsByTopic(subject, JSON.string(object, "chapter"), JSON.string(object, "topic"));
        if (array.size() < 3)
            return array;
        JsonArray three = new JsonArray();
        Random random = new Random();
        IntStream.range(0, 3).mapToObj(i -> array.remove(random.nextInt(array.size()))).forEach(three::add);
        return three;
    }

    public JsonArray latestThin(String subject, int n) {
        View view = getClient().view("test/byModified")
                .startKey(subject, Long.MAX_VALUE)
                .endKey(subject, Long.MIN_VALUE)
                .reduce(false)
                .descending(true)
                .includeDocs(true)
                .limit(n);
        List<JsonObject> objects = view.query(JsonObject.class);
        return array(objects);
    }

    private JsonArray amendAttachments(JsonObject _attachments) {
        JsonArray attachments = new JsonArray();

        Set<String> existing = StreamSupport.stream(attachments.spliterator(), false)
                .filter(a -> string((JsonObject) a, "file") != null)
                .map(a -> string((JsonObject) a, "file"))
                .collect(Collectors.toSet());

        if (_attachments != null) {
            for (Map.Entry<String, JsonElement> entry : _attachments.entrySet()) {
                String file = entry.getKey();
                JsonObject object = (JsonObject)entry.getValue();
                if (existing.contains(file))
                    continue;

                String type = string(object, "content_type");
                JsonObject attachment = attachmentFromAttachment(file, type);
                attachments.add(attachment);
            }
        }
        return attachments;
    }

    public JsonObject attachmentFromAttachment(String file, String type) {
        JsonObject attachment = new JsonObject();
        attachment.addProperty("type", "file");
        attachment.addProperty("name", file);
        attachment.addProperty("file", file);
        attachment.addProperty("mime", type);
        return attachment;
    }

    public boolean loadAttachment(Consumer<AttachmentInputStream> sender, String... dirs) throws IOException {
        CouchDbClient client = getClient();
        View view = client.view("test/byKey")
                .key(dirs[0], dirs[1], dirs[2])
                .reduce(false)
                .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonObject object = objects.get(0);
        String id = string(object,"_id");
        JsonObject attachments = object.getAsJsonObject("_attachments");
        String type = null;
        Integer length = null;
        InputStream in = null;
        if (attachments != null) {
            JsonObject attachment = attachments.getAsJsonObject(dirs[3]);
            if (attachment != null) {
                type = string(attachment, "content_type");
                length = integer(attachment, "length");
                in = client.find(id + "/" + encode(dirs[3]));
                //System.out.println("Load " + id + "/" + dirs[3] + " from couch");
                sender.accept(new AttachmentInputStream(in, dirs[3], type, length));
                in.close();
                return true;
            }
        }
        return false;
    }

    public synchronized String storeTest(String subject, String set, String json, Map<String, Upload> uploads) {
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
        else if (object.has("rename")) {
            JsonObject rename = (JsonObject)object.get("rename");
            String chapter = string(rename, "chapter");
            String topic = string(rename, "topic");
            String key = string(rename, "key");
            String name = string(object, "name");
            assert chapter != null;
            assert topic != null;
            assert key != null;
            assert name != null;
            JsonObject existing = loadTestByKey(subject, chapter, topic, key);
            existing.addProperty("key", name);
            client.update(existing);
            return "reload:";
        }
        else {
            JsonObject changed = (JsonObject)object.get("changed");

            if (object.has("old")) {                                // update
                System.out.println("updating " + changed);
                JsonObject old = (JsonObject)object.get("old");
                String chapter = string(old, "chapter");
                String topic = string(old, "topic");
                String key = string(old, "key");
                assert chapter != null;
                assert topic != null;
                assert key != null;

                JsonObject existing = null;
                List<JsonObject> array = loadSetAsList(subject, set);
                for (JsonElement element : array) {
                    if (key.equals(string((JsonObject)element, "key"))) {
                        existing = (JsonObject)element;
                    }
                }

                if (existing != null) {
                    existing.addProperty("subject", subject);
                    existing.addProperty("modified", System.currentTimeMillis());
                    existing.add("author", changed.get("author"));
                    existing.add("chapter", changed.get("chapter"));
                    existing.add("topic", changed.get("topic"));
                    existing.add("key", changed.get("key"));
                    existing.add("level", changed.get("level"));
                    existing.add("question", changed.get("question"));
                    existing.add("answer", changed.get("answer"));
                    existing.add("hint", changed.get("hint"));
                    existing.add("solution", changed.get("solution"));
                    existing.add("values", changed.get("values"));
                    existing.add("balance", changed.get("balance"));
                    existing.add("attachments", changed.get("attachments"));
                    if (checks(existing)) {
                        Response response = client.update(existing);
                        JsonArray attachments = changed.getAsJsonArray("attachments");
                        response = saveFiles(client, response, uploads, attachments);
                        JsonObject _attachments = existing.getAsJsonObject("_attachments");
                        deleteFiles(client, response, attachments, _attachments);
                    }
                    else
                        return "error:set, subject, chapter, topic or key missing";
                }
            }
            else {
                System.out.println("adding " + changed);
                changed.addProperty("subject", subject);
                long millis = System.currentTimeMillis();
                changed.addProperty("created", millis);
                changed.addProperty("modified", millis);
                changed.remove("added");
                if (checks(changed)) {
                    Response response = client.save(changed);
                    JsonArray attachments = changed.getAsJsonArray("attachments");
                    saveFiles(client, response, uploads, attachments);
                }
                else
                    return "error:set, subject, chapter, topic or key missing";
            }

            return "reload:";
        }
    }

    private Response saveFiles(CouchDbClient client, Response response, Map<String, Upload> uploads, JsonArray attachments) {
        for (JsonElement alement : attachments) {
            String file = string((JsonObject)alement,"file");
            if (file != null) {
                Upload upload = uploads.get(file);
                if (upload != null) {
                    try {
                        System.out.println("storing " + upload);
                        response = client.saveAttachment(Files.newInputStream(upload.tmp), encode(upload.fileName), upload.contentType, response.getId(), response.getRev());
                    }
                    catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
        return response;
    }

    private Response deleteFiles(CouchDbClient client, Response response, JsonArray attachments, JsonObject _attachments) {
        if (_attachments == null)
            return response;

        Set<String> existingNames = _attachments.keySet();
        for (JsonElement alement : attachments) {
            String file = string((JsonObject)alement,"file");
            if (file != null) {
                System.out.println("keeping " + file);
                existingNames.remove(file);
            }
        }
        for (String name : existingNames) {
            System.out.println("removing " + name);
            response = client.removeAttachment(encode(name), response.getId(), response.getRev());
        }
        return response;
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
        if (!oldTests.isEmpty())
            client.bulk(oldTests, true);
        client.bulk(newTests, true);

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("set", set);
        object.addProperty("count", newTests.size());
        return object;
    }

    public String[] importTestAttachment(String[] idrev, String file, String contentType , InputStream in) {
        CouchDbClient client = getClient();
        String[] dirs = file.split("/");
        if (idrev == null) {
            View view = client.view("test/byKey")
                    .key(dirs[0], dirs[1], dirs[2])
                    .reduce(false)
                    .includeDocs(true);
            List<JsonObject> objects = view.query(JsonObject.class);
            JsonObject object = objects.get(0);
            String id = string(object,"_id");
            String rev = string(object,"_rev");
            idrev = new String[] { id, rev };
        }
        Response response = client.saveAttachment(in, encode(dirs[3]), contentType, idrev[0], idrev[1]);
        return new String[] { response.getId(), response.getRev() };
    }

    public JsonObject deleteSet(String subject, String set) {
        CouchDbClient client = getClient();
        List<JsonObject> oldTests = loadSetAsList(subject, set);
        for (JsonObject object : oldTests) {
            object.addProperty("_deleted", true);
        }
        System.out.println("oldTests = " + oldTests);
        List<Response> responses = client.bulk(oldTests, true);
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
        JsonArray array = tests.loadRandomTests("Mathematik");
        System.out.println("array = " + array.size());
    }

    private static Properties readProperties(String fileName) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(fileName));
        return properties;
    }
}
