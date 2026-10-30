package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.*;
import com.mongodb.client.result.DeleteResult;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.StreamSupport;

import static kmap.JSON.*;

public class Tests {
    private final Couch couch;
    private final MongoConnection connection;

    public Tests(Couch couch) {
        this.couch = couch;
        this.connection = couch.getConnection();
    }

    private MongoCollection<Document> tests() {
        return connection.getCollection("tests");
    }

    private MongoCollection<Document> attachments() {
        return connection.getCollection("attachments");
    }

    private String instance() {
        return connection.getInstance();
    }

    public synchronized JsonArray loadSets() {
        List<Bson> pipeline = Arrays.asList(
            Aggregates.match(Filters.and(
                Filters.eq("instance", instance()),
                Filters.exists("subject"),
                Filters.exists("set")
            )),
            Aggregates.group(
                new Document("subject", "$subject").append("set", "$set"),
                Accumulators.sum("count", 1)
            ),
            Aggregates.sort(Sorts.ascending("_id.subject", "_id.set"))
        );
        JsonArray array = new JsonArray();
        for (Document doc : tests().aggregate(pipeline)) {
            Document id = doc.get("_id", Document.class);
            if (id != null) {
                JsonObject set = new JsonObject();
                set.addProperty("subject", id.getString("subject"));
                set.addProperty("set", id.getString("set"));
                set.addProperty("count", doc.getInteger("count", 0));
                array.add(set);
            }
        }
        return array;
    }

    public JsonArray loadChapters(String subject) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.exists("chapter")
        );
        JsonArray array = new JsonArray();
        for (String ch : tests().distinct("chapter", filter, String.class)) {
            array.add(ch);
        }
        return array;
    }

    public JsonArray loadTopics(String subject) {
        List<Bson> pipeline = Arrays.asList(
            Aggregates.match(Filters.and(
                Filters.eq("instance", instance()),
                Filters.eq("subject", subject),
                Filters.exists("chapter"),
                Filters.exists("topic")
            )),
            Aggregates.group(
                new Document("chapter", "$chapter").append("topic", "$topic"),
                Accumulators.sum("count", 1)
            ),
            Aggregates.sort(Sorts.ascending("_id.chapter", "_id.topic"))
        );
        JsonArray array = new JsonArray();
        for (Document doc : tests().aggregate(pipeline)) {
            Document id = doc.get("_id", Document.class);
            if (id != null) {
                JsonObject object = new JsonObject();
                object.addProperty("chapter", id.getString("chapter"));
                object.addProperty("topic", id.getString("topic"));
                object.addProperty("count", doc.getInteger("count", 0));
                array.add(object);
            }
        }
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
            Bson filter = Filters.and(
                Filters.eq("instance", instance()),
                Filters.eq("subject", subject),
                Filters.eq("set", set)
            );
            List<JsonObject> objects = new ArrayList<>();
            for (Document doc : tests().find(filter).sort(Sorts.ascending("chapter", "topic"))) {
                JsonObject o = MongoConnection.toJsonObject(doc);
                if (string(o, "chapter") == null || string(o, "topic") == null)
                    continue;
                JsonArray attachments = o.getAsJsonArray("attachments");
                JsonObject _attachments = o.getAsJsonObject("_attachments");
                o.add("attachments", amendAttachments(attachments, _attachments));
                if (!o.has("repetitions"))
                    o.addProperty("repetitions", 1);
                objects.add(o);
            }
            return objects;
        }
        catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public JsonArray loadTestsByChapter(String subject, String chapter) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("chapter", chapter)
        );
        JsonArray array = new JsonArray();
        for (Document doc : tests().find(filter)) {
            JsonObject o = MongoConnection.toJsonObject(doc);
            JsonArray attachments = o.getAsJsonArray("attachments");
                JsonObject _attachments = o.getAsJsonObject("_attachments");
                o.add("attachments", amendAttachments(attachments, _attachments));
            if (!o.has("repetitions"))
                o.addProperty("repetitions", 1);
            array.add(o);
        }
        return array;
    }

    public JsonArray loadTestsByTopic(String subject, String chapter, String topic) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("chapter", chapter),
            Filters.eq("topic", topic)
        );
        JsonArray array = new JsonArray();
        for (Document doc : tests().find(filter)) {
            JsonObject o = MongoConnection.toJsonObject(doc);
            JsonArray attachments = o.getAsJsonArray("attachments");
                JsonObject _attachments = o.getAsJsonObject("_attachments");
                o.add("attachments", amendAttachments(attachments, _attachments));
            if (!o.has("repetitions"))
                o.addProperty("repetitions", 1);
            array.add(o);
        }
        return array;
    }

    public JsonObject loadTestByKey(String subject, String chapter, String topic, String key) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("chapter", chapter),
            Filters.eq("topic", topic),
            Filters.eq("key", key)
        );
        Document doc = tests().find(filter).first();
        if (doc == null)
            return null;
        JsonObject object = MongoConnection.toJsonObject(doc);
        JsonArray attachments = object.getAsJsonArray("attachments");
                JsonObject _attachments = object.getAsJsonObject("_attachments");
                object.add("attachments", amendAttachments(attachments, _attachments));
        if (!object.has("repetitions"))
            object.addProperty("repetitions", 1);
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
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject)
        );
        List<JsonObject> objects = new ArrayList<>();
        for (Document doc : tests().find(filter).sort(Sorts.descending("modified")).limit(n)) {
            objects.add(MongoConnection.toJsonObject(doc));
        }
        return toArray(objects);
    }

    private JsonArray amendAttachments(JsonArray attachments, JsonObject _attachments) {
        if (attachments == null)
            attachments = new JsonArray();

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
        if (dirs == null || dirs.length < 4) {
            return false;
        }
        String slug = instance() + "/tests/" + dirs[0] + "/" + dirs[1] + "/" + dirs[2] + "/" + dirs[3];
        Document doc = attachments().find(Filters.eq("_id", slug)).first();
        if (doc != null) {
            org.bson.types.Binary bin = doc.get("data", org.bson.types.Binary.class);
            if (bin != null) {
                String type = doc.getString("contentType");
                Integer length = doc.getInteger("length");
                try (InputStream in = new ByteArrayInputStream(bin.getData())) {
                    sender.accept(new AttachmentInputStream(in, dirs[3], type, length));
                    return true;
                }
            }
        }
        return false;
    }

    public synchronized String storeTest(String subject, String set, String json, Map<String, Upload> uploads) {
        JsonObject object = MongoConnection.getGson().fromJson(json, JsonObject.class);
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
                    tests().deleteOne(Filters.and(
                        Filters.eq("instance", instance()),
                        Filters.eq("subject", subject),
                        Filters.eq("chapter", chapter),
                        Filters.eq("topic", topic),
                        Filters.eq("key", key)
                    ));
                    attachments().deleteMany(Filters.and(
                        Filters.eq("instance", instance()),
                        Filters.eq("card", subject + "." + set + "." + key)
                    ));
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
            Bson filter = Filters.and(
                Filters.eq("instance", instance()),
                Filters.eq("subject", subject),
                Filters.eq("chapter", chapter),
                Filters.eq("topic", topic),
                Filters.eq("key", key)
            );
            tests().updateOne(filter, Updates.set("key", name));
            String oldCardRef = subject + "." + set + "." + key;
            String newCardRef = subject + "." + set + "." + name;
            for (Document att : attachments().find(Filters.and(Filters.eq("instance", instance()), Filters.eq("card", oldCardRef)))) {
                String oldSlug = att.getString("_id");
                String attName = att.getString("name");
                String newSlug = instance() + "/tests/" + subject + "/" + set + "/" + name + "/" + attName;
                attachments().deleteOne(Filters.eq("_id", oldSlug));
                att.put("_id", newSlug);
                att.put("card", newCardRef);
                attachments().insertOne(att);
            }
            return "reload:";
        }
        else {
            JsonObject changed = (JsonObject)object.get("changed");

            if (object.has("old")) {                                // update
                JsonObject old = (JsonObject)object.get("old");
                String chapter = string(old, "chapter");
                String topic = string(old, "topic");
                String key = string(old, "key");
                assert chapter != null;
                assert topic != null;
                assert key != null;

                Bson filter = Filters.and(
                    Filters.eq("instance", instance()),
                    Filters.eq("subject", subject),
                    Filters.eq("set", set),
                    Filters.eq("key", key)
                );
                Document existingDoc = tests().find(filter).first();
                if (existingDoc != null) {
                    JsonObject existing = MongoConnection.toJsonObject(existingDoc);
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
                    existing.addProperty("repetitions", JSON.integer(changed, "repetitions", 1));
                    existing.add("extern", changed.get("extern"));
                    if (checks(existing)) {
                        tests().replaceOne(Filters.eq("_id", existingDoc.getString("_id")), MongoConnection.toDocument(existing));
                        JsonArray attachments = changed.getAsJsonArray("attachments");
                        saveFiles(subject, set, string(changed, "key"), uploads, attachments);
                        deleteFiles(subject, set, string(changed, "key"), attachments);
                    }
                    else
                        return "error:set, subject, chapter, topic or key missing";
                }
            }
            else {
                changed.addProperty("subject", subject);
                long millis = System.currentTimeMillis();
                changed.addProperty("created", millis);
                changed.addProperty("modified", millis);
                if (!changed.has("repetitions"))
                    changed.addProperty("repetitions", 1);
                changed.remove("added");
                if (checks(changed)) {
                    changed.addProperty("instance", instance());
                    changed.addProperty("_id", instance() + ":" + UUID.randomUUID().toString().replace("-", ""));
                    tests().insertOne(MongoConnection.toDocument(changed));
                    JsonArray attachments = changed.getAsJsonArray("attachments");
                    saveFiles(subject, set, string(changed, "key"), uploads, attachments);
                }
                else
                    return "error:set, subject, chapter, topic or key missing";
            }

            return "reload:";
        }
    }

    private void saveFiles(String subject, String set, String key, Map<String, Upload> uploads, JsonArray attachments) {
        if (uploads == null || attachments == null) return;
        for (JsonElement alement : attachments) {
            String file = string((JsonObject)alement, "file");
            if (file != null) {
                Upload upload = uploads.get(file);
                if (upload != null) {
                    try {
                        String slug = instance() + "/tests/" + subject + "/" + set + "/" + key + "/" + upload.fileName;
                        byte[] data = Files.readAllBytes(upload.tmp);
                        Document attDoc = new Document("_id", slug)
                                .append("instance", instance())
                                .append("target", "tests")
                                .append("card", subject + "." + set + "." + key)
                                .append("name", upload.fileName)
                                .append("contentType", upload.contentType)
                                .append("length", data.length)
                                .append("digest", null)
                                .append("data", new org.bson.types.Binary(data))
                                .append("modified", System.currentTimeMillis());
                        attachments().replaceOne(Filters.eq("_id", slug), attDoc, new ReplaceOptions().upsert(true));
                    }
                    catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }

    private void deleteFiles(String subject, String set, String key, JsonArray attachments) {
        Set<String> keepNames = new HashSet<>();
        if (attachments != null) {
            for (JsonElement alement : attachments) {
                String file = string((JsonObject)alement, "file");
                if (file != null)
                    keepNames.add(file);
            }
        }
        String cardRef = subject + "." + set + "." + key;
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("card", cardRef)
        );
        for (Document doc : attachments().find(filter)) {
            String name = doc.getString("name");
            if (name != null && !keepNames.contains(name)) {
                attachments().deleteOne(Filters.eq("_id", doc.getString("_id")));
            }
        }
    }

    private boolean checks(JsonObject object) {
        return !isMissingOrNull(object, "set")
            && !isMissingOrNull(object, "subject")
            && !isMissingOrNull(object, "chapter")
            && !isMissingOrNull(object, "topic")
            && !isMissingOrNull(object, "key");
    }

    private boolean equals(JsonObject element, String subject, String chapter, String topic, String key) {
        return subject.equals(string(element, "subject")) &&
            chapter.equals(string(element, "chapter")) &&
            topic.equals(string(element, "topic")) &&
            key.equals(string(element, "key"));
    }

    public JsonObject importSet(String subject, String set, String json) {
        JsonObject data = MongoConnection.getGson().fromJson(json, JsonObject.class);
        JsonArray array = (JsonArray)data.get("docs");
        List<Document> newTests = new ArrayList<>();
        long millis = System.currentTimeMillis();
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            object.addProperty("subject", subject);
            object.addProperty("set", set);
            object.addProperty("instance", instance());
            if (loong(object, "created") == null)
                object.addProperty("created", millis);
            if (loong(object, "modified") == null)
                object.addProperty("modified", millis);
            object.addProperty("_id", instance() + ":" + UUID.randomUUID().toString().replace("-", ""));
            object.remove("_rev");
            newTests.add(MongoConnection.toDocument(object));
        }

        tests().deleteMany(Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("set", set)
        ));

        if (!newTests.isEmpty()) {
            tests().insertMany(newTests);
        }

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("set", set);
        object.addProperty("count", newTests.size());
        return object;
    }

    public String[] importTestAttachment(String[] idrev, String file, String contentType, InputStream in) {
        String[] dirs = file.split("/");
        // dirs: [subject, set, key, fileName]
        try {
            byte[] bytes = in.readAllBytes();
            String slug = instance() + "/tests/" + dirs[0] + "/" + dirs[1] + "/" + dirs[2] + "/" + dirs[3];
            Document attDoc = new Document("_id", slug)
                    .append("instance", instance())
                    .append("target", "tests")
                    .append("card", dirs[0] + "." + dirs[1] + "." + dirs[2])
                    .append("name", dirs[3])
                    .append("contentType", contentType)
                    .append("length", bytes.length)
                    .append("digest", null)
                    .append("data", new org.bson.types.Binary(bytes))
                    .append("modified", System.currentTimeMillis());
            attachments().replaceOne(Filters.eq("_id", slug), attDoc, new ReplaceOptions().upsert(true));
            return new String[] { slug, "1" };
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public JsonObject deleteSet(String subject, String set) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("set", set)
        );
        for (Document doc : tests().find(filter)) {
            String key = doc.getString("key");
            if (key != null) {
                attachments().deleteMany(Filters.and(
                    Filters.eq("instance", instance()),
                    Filters.eq("card", subject + "." + set + "." + key)
                ));
            }
        }
        DeleteResult res = tests().deleteMany(filter);

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("set", set);
        object.addProperty("count", (int) res.getDeletedCount());
        return object;
    }

    public static void main(String[] args) throws IOException {
        Server.CLIENT.set("lala");
        Tests tests = new Tests(new Couch(readProperties(args[0])));
        JsonArray array = tests.loadRandomTests("Mathematik");
        System.out.println("array = " + array.size());
    }

    private static Properties readProperties(String fileName) throws IOException {
        return Config.load(fileName);
    }
}
