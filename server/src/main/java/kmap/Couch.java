package kmap;

import com.google.gson.*;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.*;
import com.mongodb.client.result.DeleteResult;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static java.util.Objects.requireNonNullElse;
import static kmap.JSON.*;

/**
 * Created by holger on 04.04.17.
 * Refactored to MongoDB backend.
 */
public class Couch extends Server {

    private final MongoConnection connection;

    public Couch(Properties properties) {
        super(properties);
        connection = new MongoConnection(properties);
    }

    public MongoConnection getConnection() {
        return connection;
    }

    private MongoCollection<Document> cards() {
        return connection.getCollection("cards");
    }

    private MongoCollection<Document> attachments() {
        return connection.getCollection("attachments");
    }

    private String instance() {
        return connection.getInstance();
    }

    Gson getGson() {
        return MongoConnection.getGson();
    }

    public synchronized JsonArray loadModule(String subject, String module) {
        List<JsonObject> objects = loadModuleAsList(subject, module);
        return toArray(objects);
    }

    private List<JsonObject> loadModuleAsList(String subject, String module) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("module", module),
            Filters.exists("chapter"),
            Filters.exists("topic")
        );
        List<JsonObject> objects = new ArrayList<>();
        for (Document doc : cards().find(filter).sort(Sorts.ascending("chapter", "topic"))) {
            JsonObject o = MongoConnection.toJsonObject(doc);
            if (string(o, "chapter") == null || string(o, "topic") == null)
                continue;
            o.addProperty("module", module);
            JsonArray attachments = o.getAsJsonArray("attachments");
            JsonObject _attachments = o.getAsJsonObject("_attachments");
            o.add("attachments", amendAttachments(attachments, _attachments));
            fixAttachments(attachments, subject, string(o, "chapter"), string(o, "topic"));
            o.remove("_attachments");
            objects.add(o);
        }
        return objects;
    }

    public JsonArray latest(String subject, int n, boolean includeChapters) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.exists("chapter"),
            Filters.exists("topic")
        );
        List<JsonObject> objects = new ArrayList<>();
        for (Document doc : cards().find(filter).sort(Sorts.descending("modified"))) {
            JsonObject o = MongoConnection.toJsonObject(doc);
            if (includeChapters) {
                if (string(o, "chapter") == null
                        || string(o, "topic") == null
                        || ("_".equals(string(o, "topic")) && stringTrim(o, "summary") == null))
                    continue;
            } else {
                if (string(o, "chapter") == null
                        || string(o, "topic") == null
                        || "_".equals(string(o, "topic"))
                        || string(o, "description") == null
                        || stringTrim(o, "description").length() == 0)
                    continue;
            }
            JSON.removeEmptyStrings(o);
            JsonArray attachments = o.getAsJsonArray("attachments");
            JsonObject _attachments = o.getAsJsonObject("_attachments");
            o.add("attachments", amendAttachments(attachments, _attachments));
            fixAttachments(attachments, subject, string(o, "chapter"), string(o, "topic"));
            o.remove("_attachments");
            objects.add(o);
            if (objects.size() >= n)
                break;
        }
        return toArray(objects);
    }

    public synchronized JsonArray loadModules() {
        List<Bson> pipeline = Arrays.asList(
            Aggregates.match(Filters.and(
                Filters.eq("instance", instance()),
                Filters.exists("subject"),
                Filters.exists("module"),
                Filters.exists("chapter"),
                Filters.exists("topic")
            )),
            Aggregates.group(
                new Document("subject", "$subject").append("module", "$module"),
                Accumulators.sum("count", 1)
            ),
            Aggregates.sort(Sorts.ascending("_id.subject", "_id.module"))
        );
        JsonArray array = new JsonArray();
        for (Document doc : cards().aggregate(pipeline)) {
            Document id = doc.get("_id", Document.class);
            if (id != null) {
                JsonObject module = new JsonObject();
                module.addProperty("subject", id.getString("subject"));
                module.addProperty("module", id.getString("module"));
                module.addProperty("count", doc.getInteger("count", 0));
                array.add(module);
            }
        }
        return array;
    }

    public JsonArray loadSubjects() {
        List<Bson> pipeline = Arrays.asList(
            Aggregates.match(Filters.and(
                Filters.eq("instance", instance()),
                Filters.exists("subject"),
                Filters.nin("subject", "Hilfe", "Blog"),
                Filters.exists("chapter"),
                Filters.exists("topic")
            )),
            Aggregates.group("$subject", Accumulators.sum("count", 1)),
            Aggregates.sort(Sorts.ascending("_id"))
        );
        JsonArray array = new JsonArray();
        for (Document doc : cards().aggregate(pipeline)) {
            String subject = doc.getString("_id");
            if (subject != null) {
                JsonObject subjectObj = new JsonObject();
                subjectObj.addProperty("name", subject);
                subjectObj.addProperty("count", doc.getInteger("count", 0));
                array.add(subjectObj);
            }
        }
        return array;
    }

    public synchronized String storeTopic(String subject, String module, String json, Map<String, Upload> uploads) {
        JsonObject object = MongoConnection.getGson().fromJson(json, JsonObject.class);
        if (object.has("delete")) {                                 // delete
            JsonObject old = (JsonObject)object.get("delete");
            String chapter = string(old, "chapter");
            String topic = string(old, "topic");
            assert chapter != null;
            assert topic != null;
            List<JsonObject> array = loadModuleAsList(subject, module);
            int pos = -1;
            for (JsonObject element : array) {
                pos++;
                if (equals(element, subject, chapter, topic)) {
                    cards().deleteOne(Filters.and(
                        Filters.eq("instance", instance()),
                        Filters.eq("subject", subject),
                        Filters.eq("chapter", chapter),
                        Filters.eq("topic", topic)
                    ));
                    attachments().deleteMany(Filters.and(
                        Filters.eq("instance", instance()),
                        Filters.eq("card", subject + "." + chapter + "." + topic)
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
            String newChapter = string(object, "newChapter");
            String newTopic = string(object, "newTopic");
            assert chapter != null;
            assert topic != null;
            assert newChapter != null;
            assert newTopic != null;
            boolean chapterChange = !chapter.equals(newChapter);
            List<JsonObject> list = loadChapterAsList(subject, chapter);
            for (JsonObject element : list) {
                if (equals(element, subject, chapter, topic)) {
                    element.addProperty("chapter", newChapter);
                    element.addProperty("topic", newTopic);
                    element.remove("depends");
                    cards().replaceOne(Filters.eq("_id", string(element, "_id")), MongoConnection.toDocument(element));
                }
                else if (equals(element, subject, chapter, null)) {
                    boolean change = false;
                    JsonArray depends = element.getAsJsonArray("depends");
                    if (depends != null) {
                        JsonArray newDepends = new JsonArray(depends.size());
                        for (int i = 0; i < depends.size(); i++) {
                            if (depends.get(i).getAsString().equals(topic)) {
                                if (!chapterChange)
                                    newDepends.add(new JsonPrimitive(newTopic));
                                change = true;
                            } else
                                newDepends.add(depends.get(i));
                        }
                        if (change) {
                            element.add("depends", newDepends);
                            cards().replaceOne(Filters.eq("_id", string(element, "_id")), MongoConnection.toDocument(element));
                        }
                    }
                }
            }
            // Update attachment soft-references if card was renamed
            String oldCardRef = subject + "." + chapter + "." + topic;
            String newCardRef = subject + "." + newChapter + "." + newTopic;
            for (Document att : attachments().find(Filters.and(Filters.eq("instance", instance()), Filters.eq("card", oldCardRef)))) {
                String oldSlug = att.getString("_id");
                String name = att.getString("name");
                String newSlug = instance() + "/cards/" + subject + "/" + newChapter + "/" + newTopic + "/" + name;
                attachments().deleteOne(Filters.eq("_id", oldSlug));
                att.put("_id", newSlug);
                att.put("card", newCardRef);
                attachments().insertOne(att);
            }
            return "reload:";
        }
        else if (object.has("move")) {
            JsonObject move = (JsonObject)object.get("move");
            String chapter = string(move, "chapter");
            String topic = string(move, "topic");
            String nmodule = string(object, "module");
            assert chapter != null;
            assert topic != null;
            assert nmodule != null;
            Bson filter = Filters.and(
                Filters.eq("instance", instance()),
                Filters.eq("subject", subject),
                Filters.eq("chapter", chapter),
                Filters.eq("topic", topic)
            );
            cards().updateOne(filter, Updates.set("module", nmodule));
            return "reload:";
        }
        else {
            JsonObject changed = (JsonObject)object.get("changed");
            if (changed.get("priority") != null && (changed.get("priority").isJsonNull() || string(changed, "priority") == null))
                changed.remove("priority");

            if (object.has("old")) {                                // update
                JsonObject old = (JsonObject)object.get("old");
                String chapter = string(old, "chapter");
                String topic = string(old, "topic");
                assert chapter != null;
                assert topic != null;

                Bson filter = Filters.and(
                    Filters.eq("instance", instance()),
                    Filters.eq("subject", subject),
                    Filters.eq("chapter", chapter),
                    Filters.eq("topic", topic)
                );
                Document existingDoc = cards().find(filter).first();
                if (existingDoc != null) {
                    JsonObject existing = MongoConnection.toJsonObject(existingDoc);
                    existing.addProperty("subject", subject);
                    if (!JSON.bool(changed, "minorEdit"))
                        existing.addProperty("modified", System.currentTimeMillis());
                    existing.add("created", changed.get("created"));
                    existing.add("author", changed.get("author"));
                    existing.add("chapter", changed.get("chapter"));
                    existing.add("topic", changed.get("topic"));
                    existing.add("links", changed.get("links"));
                    existing.add("depends", changed.get("depends"));
                    existing.add("priority", changed.get("priority"));
                    existing.add("keywords", changed.get("keywords"));
                    existing.add("sgs", changed.get("sgs"));
                    existing.add("educationalLevel", changed.get("educationalLevel"));
                    existing.add("educationalContext", changed.get("educationalContext"));
                    existing.add("typicalAgeRange", changed.get("typicalAgeRange"));
                    existing.add("description", changed.get("description"));
                    existing.add("meta", changed.get("meta"));
                    existing.add("thumb", changed.get("thumb"));
                    existing.add("summary", changed.get("summary"));
                    existing.add("attachments", changed.get("attachments"));
                    existing.add("skills", changed.get("skills"));
                    if (checks(changed)) {
                        cards().replaceOne(Filters.eq("_id", existingDoc.getString("_id")), MongoConnection.toDocument(existing));
                        JsonArray attachments = changed.getAsJsonArray("attachments");
                        saveFiles(subject, string(changed, "chapter"), string(changed, "topic"), uploads, attachments);
                        deleteFiles(subject, string(changed, "chapter"), string(changed, "topic"), attachments);
                    }
                    else
                        return "error:module, subject, chapter or topic missing";
                }
            }
            else {
                changed.remove("added");
                changed.addProperty("subject", subject);
                Long created = JSON.loong(changed, "created");
                if (created != null)
                    changed.addProperty("modified", created);
                else {
                    long millis = System.currentTimeMillis();
                    changed.addProperty("created", millis);
                    changed.addProperty("modified", millis);
                }
                if (checks(changed)) {
                    changed.addProperty("instance", instance());
                    changed.addProperty("_id", instance() + ":" + UUID.randomUUID().toString().replace("-", ""));
                    cards().insertOne(MongoConnection.toDocument(changed));
                    JsonArray attachments = changed.getAsJsonArray("attachments");
                    saveFiles(subject, string(changed, "chapter"), string(changed, "topic"), uploads, attachments);
                }
                else
                    return "error:module, subject, chapter or topic missing";
            }

            return "reload:";
        }
    }

    private void saveFiles(String subject, String chapter, String topic, Map<String, Upload> uploads, JsonArray attachments) {
        if (uploads == null || attachments == null) return;
        for (JsonElement alement : attachments) {
            String file = string((JsonObject)alement, "file");
            if (file != null) {
                Upload upload = uploads.get(file);
                if (upload != null) {
                    try {
                        System.out.println("saving " + upload);
                        String slug = instance() + "/cards/" + subject + "/" + chapter + "/" + topic + "/" + upload.fileName;
                        byte[] data = Files.readAllBytes(upload.tmp);
                        Document attDoc = new Document("_id", slug)
                                .append("instance", instance())
                                .append("target", "cards")
                                .append("card", subject + "." + chapter + "." + topic)
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

    private void deleteFiles(String subject, String chapter, String topic, JsonArray attachments) {
        Set<String> keepNames = new HashSet<>();
        if (attachments != null) {
            for (JsonElement alement : attachments) {
                String file = string((JsonObject)alement, "file");
                if (file != null)
                    keepNames.add(file);
            }
        }
        String cardRef = subject + "." + chapter + "." + topic;
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("card", cardRef)
        );
        for (Document doc : attachments().find(filter)) {
            String name = doc.getString("name");
            if (name != null && !keepNames.contains(name)) {
                System.out.println("removing " + name);
                attachments().deleteOne(Filters.eq("_id", doc.getString("_id")));
            }
        }
    }

    public String[] importAttachment(String[] idrev, String file, String contentType, InputStream in) {
        String[] dirs = file.split("/");
        // dirs: [subject, chapter, topic, fileName]
        try {
            byte[] bytes = in.readAllBytes();
            String slug = instance() + "/cards/" + dirs[0] + "/" + dirs[1] + "/" + dirs[2] + "/" + dirs[3];
            Document attDoc = new Document("_id", slug)
                    .append("instance", instance())
                    .append("target", "cards")
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

    private boolean checks(JsonObject object) {
        return !isMissingOrNull(object,"module")
            && !isMissingOrNull(object,"subject")
            && !isMissingOrNull(object,"chapter")
            && !isMissingOrNull(object,"topic");
    }

    private boolean equals(JsonObject element, String subject, String chapter, String topic) {
        return subject.equals(string(element, "subject")) &&
            chapter.equals(string(element, "chapter")) &&
            (topic == null || topic.equals(string(element, "topic")));
    }

    public synchronized JsonObject chapter(String subject, String name) {
        return chapter(subject, name, false);
    }

    public synchronized JsonObject chapter(String subject, String name, boolean includeContent) {
        List<JsonObject> objects = loadChapterAsList(subject, name);
        Map<String, Node> nodes = new HashMap<>();
        Map<String, Connection> connections = new HashMap<>();

        JsonObject board = new JsonObject();
        board.addProperty("subject", subject);
        board.addProperty("chapter", name);
        Map<String, Set<String>> aggregates = new HashMap<>();
        Map<String, String> links = links(subject);
        MultiMap<String, String> deps = deps(subject);
        JsonArray lines = new JsonArray();
        board.add("lines", lines);

        Node chapterNode = null;
        for (Iterator<JsonObject> iterator = objects.iterator(); iterator.hasNext(); ) {
            JsonObject topic = iterator.next();
            String topicName = string(topic, "topic");
            if ("_".equals(topicName)) {
                chapterNode = new Node("_");
                chapterNode.setModule(string(topic, "module"));
                chapterNode.setCreated(loong(topic, "created"));
                chapterNode.setModified(loong(topic, "modified"));
                chapterNode.setAuthor(string(topic, "author"));
                chapterNode.setKeywords(string(topic, "keywords"));
                chapterNode.setSGS(string(topic, "sgs"));
                chapterNode.setEducationalLevel(string(topic, "educationalLevel"));
                chapterNode.setEducationalContext(string(topic, "educationalContext"));
                chapterNode.setTypicalAgeRange(string(topic, "typicalAgeRange"));
                if (includeContent) {
                    chapterNode.setMeta(string(topic, "meta"));
                    chapterNode.setDescription(string(topic, "description"));
                }
                chapterNode.setSummary(string(topic, "summary"));
                chapterNode.setAttachments(amendAttachments(topic.getAsJsonArray("attachments"), topic.getAsJsonObject("_attachments")));
                chapterNode.setSkills(topic.getAsJsonArray("skills"));
                iterator.remove();
            }
            else {
                Node node = new Node(topicName);
                node.setModule(string(topic, "module"));
                node.setCreated(loong(topic, "created"));
                node.setModified(loong(topic, "modified"));
                node.setAuthor(string(topic, "author"));
                node.setKeywords(string(topic, "keywords"));
                node.setSGS(string(topic, "sgs"));
                node.setEducationalLevel(string(topic, "educationalLevel"));
                node.setEducationalContext(string(topic, "educationalContext"));
                node.setTypicalAgeRange(string(topic, "typicalAgeRange"));
                if (includeContent) {
                    node.setMeta(string(topic, "meta"));
                    node.setDescription(string(topic, "description"));
                }
                node.setSummary(string(topic, "summary"));
                node.setThumb(string(topic, "thumb"));
                node.setPriority(integer(topic, "priority"));
                node.setLinks(string(topic, "links"));
                node.setAttachments(amendAttachments(topic.getAsJsonArray("attachments"), topic.getAsJsonObject("_attachments")));
                node.setSkills(topic.getAsJsonArray("skills"));
                nodes.put(topicName, node);
            }
        }
        for (JsonObject topic : objects) {
            JsonArray depends = topic.getAsJsonArray("depends");
            String topicName = string(topic, "topic");
            Node node = nodes.get(topicName);
            if (depends != null) {
                for (JsonElement depend : depends) {
                    String dependsOn = depend.getAsString();
                    Connection connection = connections.computeIfAbsent(dependsOn + ":" + topicName, s -> {
                        Node source = nodes.get(dependsOn);
                        if (source == null) {
                            System.out.println("WARNING: source node " + dependsOn + " missing");
                            return null;
                        }
                        Node target = nodes.get(topicName);
                        if (target == null) {
                            System.out.println("WARNING: target node" + topicName + " missing");
                            return null;
                        }
                        return new Connection(source, target);
                    });
                    if (connection == null)
                        node.getAnnotations().add("inconsistent dependency");

                    node.getDepends().add(dependsOn);
                }
            }
        }

        List<String> transitiveDepends = new ArrayList<>();
        deps.entrySet().stream().filter(entry -> entry.getKey().equals(name)).flatMap(entry -> entry.getValue().stream()).forEach(depend -> {
            int i = depend.indexOf('.');
            String dependChapter = depend.substring(0, i);
            String dependTopic = depend.substring(i + 1);
            transitiveDepends.add(links.containsKey(depend) ? links.get(depend) : dependChapter + "/" + dependTopic);
        });

        if (chapterNode == null)
            chapterNode = new Node("_");

        if (!transitiveDepends.isEmpty()) {
            chapterNode.getDepends().addAll(transitiveDepends);
        }

        List<Node> list = layout(nodes, connections);

        JsonObject line;
        JsonArray cards = new JsonArray();

        int row = 0;
        for (Node node : list) {
            if (node.row != row) {
                line = new JsonObject();
                cards = new JsonArray();
                line.add("cards", cards);
                lines.add(line);
                row++;
            }
            fixAttachments(node.getAttachments(), subject, name, node.getTopic());
            JsonObject card = new JsonObject();
            if (node.getCreated() != null)
                card.addProperty("created", node.getCreated());
            if (node.getModified() != null)
                card.addProperty("modified", node.getModified());
            if (node.getAuthor() != null)
                card.addProperty("author", node.getAuthor());
            card.addProperty("module", node.getModule());
            card.addProperty("topic", node.getTopic());
            card.addProperty("row", node.getRow());
            card.addProperty("col", node.getColumn());
            JSON.addProperty(card, "keywords", node.getKeywords());
            JSON.addProperty(card, "sgs", node.getSGS());
            JSON.addProperty(card, "educationalLevel", node.getEducationalLevel());
            JSON.addProperty(card, "educationalContext", node.getEducationalContext());
            JSON.addProperty(card, "typicalAgeRange", node.getTypicalAgeRange());
            if (includeContent) {
                JSON.addProperty(card, "description", node.getDescription());
                JSON.addProperty(card, "meta", node.getMeta());
            }
            JSON.addProperty(card, "summary", node.getSummary());
            JSON.addProperty(card, "thumb", node.getThumb());
            JSON.addProperty(card, "links", node.getLinks());
            add(card, "attachments", node.getAttachments());
            add(card, "skills", node.getSkills());
            JsonArray depends = new JsonArray();
            JsonArray dependencies = new JsonArray();
            for (String dependName : node.getDepends()) {
                depends.add(dependName);
                String link = links.get(name + "." + dependName);
                dependencies.add(link != null ? link : name + "/" + dependName);
            }
            card.add("depends", depends);
            card.add("dependencies", dependencies);
            card.addProperty("annotations", String.join(", ", node.getAnnotations()));
            JSON.addProperty(card, "priority", node.getPriority());
            cards.add(card);
        }

        if (chapterNode != null) {
            chapterNode.setLinks(String.join("/", backlinks(links, name)));
            fixAttachments(chapterNode.getAttachments(), subject, name, "_");
            JsonObject card = new JsonObject();
            card.addProperty("module", chapterNode.getModule());
            card.addProperty("topic", "_");
            if (!chapterNode.getDepends().isEmpty()) {
                JsonArray array = new JsonArray();
                chapterNode.getDepends().forEach(array::add);
                add(card, "dependencies", array);
            }
            JSON.addProperty(card, "keywords", chapterNode.getKeywords());
            JSON.addProperty(card, "sgs", chapterNode.getSGS());
            JSON.addProperty(card, "educationalLevel", chapterNode.getEducationalLevel());
            JSON.addProperty(card, "educationalContext", chapterNode.getEducationalContext());
            JSON.addProperty(card, "typicalAgeRange", chapterNode.getTypicalAgeRange());
            if (includeContent) {
                JSON.addProperty(card, "description", chapterNode.getDescription());
                JSON.addProperty(card, "meta", chapterNode.getMeta());
            }
            JSON.addProperty(card, "summary", chapterNode.getSummary());
            JSON.addProperty(card, "links", chapterNode.getLinks());
            add(card, "attachments", chapterNode.getAttachments());
            add(card, "skills", chapterNode.getSkills());
            board.add("chapterCard", card);
        }
        return board;
    }

    private List<JsonObject> loadChapterAsList(String subject, String name) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("chapter", name)
        );
        List<JsonObject> list = new ArrayList<>();
        for (Document doc : cards().find(filter)) {
            list.add(MongoConnection.toJsonObject(doc));
        }
        return list;
    }

    private List<String> backlinks(Map<String, String> links, String name) {
        List<String> backlinks = new ArrayList<>();
        for (Map.Entry<String, String> entry : links.entrySet()) {
            if (name.equals(entry.getValue()))
                backlinks.add(entry.getKey().split("\\.")[0]);
        }
        return backlinks;
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

    private void debugLinks(String subject, Map<String, String> links) {
        String fileName = "/tmp/chapter-links.csv";
        try {
            Files.write(Paths.get(fileName),
                    links.entrySet().stream().map(entry -> "\"" + subject + "." + entry.getKey() + "\", \"" + entry.getValue() + "\"").collect(Collectors.toList()));
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void debugDeps(String subject, MultiMap<String, String> deps) {
        String fileName = "/tmp/chapter-deps.csv";
        try {
            Files.write(Paths.get(fileName),
                    deps.entrySet().stream().map(entry -> "\"" + subject + "." + entry.getKey() + "\", \"" + entry.getValue() + "\"").collect(Collectors.toList()));
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    void fixAttachments(JsonArray array, String subject, String chapter, String topic) {
        if (array == null)
            return;

        for (JsonElement element: array) {
            JsonObject attachment = (JsonObject)element;
            String name = string(attachment, "name");
            String file = string(attachment, "file");
            String type = string(attachment, "type");
            String mime = string(attachment, "mime");
            String href = string(attachment, "href");
            if ("link".equals(type)) {
                if (mime == null) {
                    mime = "text/html";
                    attachment.addProperty("mime", mime);
                }
            }
            else if ("file".equals(type)) {
                if (file == null && name != null) {
                    file = name;
                    attachment.addProperty("file", file);
                }
                if (mime == null && file != null) {
                    mime = MimeTypes.guessType(file);
                    attachment.addProperty("mime", mime);
                }
                String fileName = encode(file);
                String path = "data/" + encode(subject) + "/" + encode(chapter) + "/" + encode(topic) + "/" + fileName;
                attachment.addProperty("href", path);
            }
            else {
                if (mime == null && type.contains("/")) {
                    mime = type;
                    attachment.addProperty("mime", mime);
                    type = "file";
                    attachment.addProperty("type", type);
                }
                if (file == null && name != null) {
                    file = name;
                    attachment.addProperty("file", file);
                }
                String fileName = encode(file);
                String path = "data/" + encode(subject) + "/" + encode(chapter) + "/" + encode(topic) + "/" + fileName;
                attachment.addProperty("href", path);
            }
        }
    }

    public boolean loadAttachment(Consumer<AttachmentInputStream> sender, String... dirs) throws IOException {
        if (dirs == null || dirs.length < 4) {
            return false;
        }
        String slug = instance() + "/cards/" + dirs[0] + "/" + dirs[1] + "/" + dirs[2] + "/" + dirs[3];
        Document doc = attachments().find(Filters.eq("_id", slug)).first();
        if (doc != null) {
            org.bson.types.Binary bin = doc.get("data", org.bson.types.Binary.class);
            if (bin != null) {
                String type = doc.getString("contentType");
                Integer length = doc.getInteger("length");
                String digest = doc.getString("digest");
                try (InputStream in = new ByteArrayInputStream(bin.getData())) {
                    sender.accept(new AttachmentInputStream(in, dirs[3], type, length, digest));
                    return true;
                }
            }
        }
        return false;
    }

    public void fix(String path, List<JsonObject> list) {
        String[] dirs = path.split("/");
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", dirs[0]),
            Filters.eq("chapter", dirs[1]),
            Filters.eq("topic", dirs[2])
        );
        Document doc = cards().find(filter).first();
        if (doc != null) {
            JsonObject object = MongoConnection.toJsonObject(doc);
            JsonArray attachments = object.getAsJsonArray("attachments");
            if (attachments == null)
                attachments = new JsonArray();
            list.forEach(attachments::add);
            object.add("attachments", attachments);
            cards().replaceOne(filter, MongoConnection.toDocument(object));
        }
    }

    public JsonObject loadTopic(String... dirs) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", dirs[0]),
            Filters.eq("chapter", dirs[1]),
            Filters.eq("topic", dirs[2])
        );
        Document doc = cards().find(filter).first();
        if (doc == null)
            return null;
        JsonObject o = MongoConnection.toJsonObject(doc);
        JsonArray attachments = o.getAsJsonArray("attachments");
        JsonObject _attachments = o.getAsJsonObject("_attachments");
        o.add("attachments", amendAttachments(attachments, _attachments));
        fixAttachments(attachments, dirs[0], string(o, "chapter"), string(o, "topic"));
        return o;
    }

    public synchronized JsonArray search(String filter) {
        Bson query = Filters.and(
            Filters.eq("instance", instance()),
            Filters.text(filter)
        );
        JsonArray rows = new JsonArray();
        for (Document doc : cards().find(query).limit(50)) {
            JsonObject row = new JsonObject();
            row.addProperty("id", doc.getString("_id"));
            JsonObject fields = new JsonObject();
            fields.addProperty("subject", doc.getString("subject"));
            fields.addProperty("chapter", doc.getString("chapter"));
            fields.addProperty("topic", doc.getString("topic"));
            fields.addProperty("summary", doc.getString("summary"));
            fields.addProperty("description", doc.getString("description"));
            fields.addProperty("thumb", doc.getString("thumb"));
            row.add("fields", fields);
            rows.add(row);
        }
        return rows;
    }

    private String encode(String string) {
        try {
            return URLEncoder.encode(string, "UTF-8").replace("+", "%20");
        }
        catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, String> links(String subject) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.exists("links"),
            Filters.ne("links", null),
            Filters.ne("links", "")
        );
        Map<String, String> map = new HashMap<>();
        for (Document doc : cards().find(filter)) {
            String chapter = doc.getString("chapter");
            String topic = doc.getString("topic");
            String links = doc.getString("links");
            if (chapter != null && topic != null && links != null && !links.isEmpty()) {
                map.put(chapter + "." + topic, links);
            }
        }
        return map;
    }

    public MultiMap<String, String> deps(String subject) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.exists("links"),
            Filters.ne("links", null),
            Filters.ne("links", ""),
            Filters.exists("depends")
        );
        MultiMap<String, String> deps = new MultiMap<>();
        for (Document doc : cards().find(filter)) {
            String links = doc.getString("links");
            String chapter = doc.getString("chapter");
            List<String> dependsList = doc.getList("depends", String.class);
            if (links != null && chapter != null && dependsList != null) {
                for (String dep : dependsList) {
                    deps.put(links, chapter + "." + dep);
                }
            }
        }
        return deps;
    }

    public JsonObject dependencies(String subject) {
        MultiMap<String, String> deps = deps(subject);
        JsonObject chapters = new JsonObject();
        for (Map.Entry<String, Set<String>> entry : deps.entrySet()) {
            JsonArray array = new JsonArray();
            entry.getValue().forEach(array::add);
            chapters.add(entry.getKey(), array);
        }
        return chapters;
    }

    public JsonArray tree(String subject) {
        Map<String, String> links = links(subject);
        List<String> paths = new ArrayList<>();

        for (String chapter : links.values()) {
            String path = chapter;
            String parent = chapter;
            while ((parent = findParent(links, parent)) != null) {
                path = path.replace(chapter, parent);
                parent = parent.substring(0, parent.indexOf("."));
                chapter = parent;
            }
            paths.add(path);
        }
        Collections.sort(paths);
        JsonArray array = new JsonArray();
        paths.forEach(array::add);
        return array;
    }

    private String findParent(Map<String, String> links, String chapter) {
        for (String key : links.keySet()) {
            if (key.endsWith("." + chapter))
                return key;
        }
        return null;
    }

    protected Set<String> aggregates(Map<String, String> links, Map<String, Set<String>> aggregates, String chapter) {
        Set<String> list = aggregates.get(chapter);
        if (list != null)
            return list;

        list = new HashSet<>();
        aggregates.put(chapter, list);

        for (Map.Entry<String, String> entry : links.entrySet()) {
            if (entry.getKey().startsWith(chapter + ".")) {
                list.add(entry.getValue());
                list.addAll(aggregates(links, aggregates, entry.getValue()));
            }
        }

        return list;
    }

    public JsonArray chapters(String subject) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.exists("chapter")
        );
        JsonArray array = new JsonArray();
        for (String chapter : cards().distinct("chapter", filter, String.class)) {
            array.add(chapter);
        }
        return array;
    }

    public JsonArray topics(String subject, String chapter) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("chapter", chapter),
            Filters.or(Filters.exists("links", false), Filters.eq("links", null), Filters.eq("links", ""))
        );
        JsonArray array = new JsonArray();
        for (String topic : cards().distinct("topic", filter, String.class)) {
            array.add(topic);
        }
        return array;
    }

    public JsonArray topics(String subject) {
        JsonArray array = new JsonArray();
        topicsAsList(subject).forEach(array::add);
        return array;
    }

    public List<String> topicsAsList(String subject) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.or(Filters.exists("links", false), Filters.eq("links", null), Filters.eq("links", ""))
        );
        List<String> list = new ArrayList<>();
        for (Document doc : cards().find(filter)) {
            String chapter = doc.getString("chapter");
            String topic = doc.getString("topic");
            if (chapter != null && topic != null) {
                list.add(chapter + "." + topic);
            }
        }
        return list;
    }

    Map<String, Integer> counts(String subject) {
        List<Bson> pipeline = Arrays.asList(
            Aggregates.match(Filters.and(
                Filters.eq("instance", instance()),
                Filters.eq("subject", subject),
                Filters.or(Filters.exists("links", false), Filters.eq("links", null), Filters.eq("links", "")),
                Filters.ne("topic", "_"),
                Filters.exists("chapter")
            )),
            Aggregates.group("$chapter", Accumulators.sum("count", 1))
        );
        Map<String, Integer> map = new HashMap<>();
        for (Document doc : cards().aggregate(pipeline)) {
            String chapter = doc.getString("_id");
            if (chapter != null) {
                map.put(chapter, doc.getInteger("count", 0));
            }
        }
        return map;
    }

    private List<Node> layout(Map<String, Node> nodes, Map<String, Connection> connections) {
        Set<Node> nodeSet = new HashSet<>(nodes.values());
        Set<Connection> connectionSet = new HashSet<>(connections.values());
        NodeLayouter.layout(nodeSet, connectionSet);
        List<Node> list = new ArrayList<>(nodeSet);
        list.sort((o1, o2) -> {
            if (o1.row != o2.row)
                return o1.row - o2.row;
            else
                return o1.column - o2.column;
        });
        return list;
    }

    public void walk(String subject) {
        List<String> book = new ArrayList<>();
        Map<String, String> links = links(subject);
        walk(book, links, subject, subject);
        book.forEach(System.out::println);
    }

    public void walk(List<String> book, Map<String, String> links, String subject, String chapter) {
        book.add(chapter);
        JsonObject chapterObject = chapter(subject, chapter, true);
        for (JsonElement lineObject : chapterObject.getAsJsonArray("lines")) {
            for (JsonElement topicObject : ((JsonObject)lineObject).getAsJsonArray("cards")) {
                book.add(chapter + "." + string((JsonObject)topicObject, "topic"));
                String consists = string((JsonObject)topicObject, "links");
                if (consists != null) {
                    walk(book, links, subject, links.get(chapter + "." + consists));
                }
            }
        }
    }

    public JsonObject importModule(String subject, String module, String json) {
        JsonObject data = MongoConnection.getGson().fromJson(json, JsonObject.class);
        JsonArray array = (JsonArray)data.get("docs");
        List<Document> newTopics = new ArrayList<>();
        long millis = System.currentTimeMillis();
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            object.addProperty("subject", subject);
            object.addProperty("module", module);
            object.addProperty("instance", instance());
            if (loong(object, "created") == null)
                object.addProperty("created", millis);
            if (loong(object, "modified") == null)
                object.addProperty("modified", millis);
            object.addProperty("_id", instance() + ":" + UUID.randomUUID().toString().replace("-", ""));
            object.remove("_rev");
            newTopics.add(MongoConnection.toDocument(object));
        }

        cards().deleteMany(Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("module", module)
        ));

        if (!newTopics.isEmpty()) {
            cards().insertMany(newTopics);
        }

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("module", module);
        object.addProperty("count", newTopics.size());
        return object;
    }

    public JsonObject deleteModule(String subject, String module) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.eq("module", module)
        );
        for (Document doc : cards().find(filter)) {
            String chapter = doc.getString("chapter");
            String topic = doc.getString("topic");
            if (chapter != null && topic != null) {
                attachments().deleteMany(Filters.and(
                    Filters.eq("instance", instance()),
                    Filters.eq("card", subject + "." + chapter + "." + topic)
                ));
            }
        }
        DeleteResult res = cards().deleteMany(filter);

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("module", module);
        object.addProperty("count", (int) res.getDeletedCount());
        return object;
    }

    public synchronized JsonArray checks(String subject) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", subject),
            Filters.exists("chapter"),
            Filters.exists("topic")
        );
        JsonArray messages = new JsonArray();
        for (Document doc : cards().find(filter)) {
            JsonObject object = MongoConnection.toJsonObject(doc);
            JsonArray attachments = requireNonNullElse(object.getAsJsonArray("attachments"), new JsonArray());
            for (JsonElement element : attachments) {
                JsonObject attachment = (JsonObject)element;
                if ("file".equals(JSON.string(attachment, "type"))) {
                    String file = JSON.string(attachment, "file");
                    String slug = instance() + "/cards/" + doc.getString("subject") + "/" + doc.getString("chapter") + "/" + doc.getString("topic") + "/" + file;
                    if (file != null && attachments().countDocuments(Filters.eq("_id", slug)) == 0) {
                        System.out.println(formatIdentity(object) + ": lost the file for " + JSON.string(attachment, "name"));
                        JsonObject message = new JsonObject();
                        message.addProperty("id", JSON.string(object, "_id"));
                        message.addProperty("chapter", JSON.string(object, "chapter"));
                        message.addProperty("topic", JSON.string(object, "topic"));
                        message.addProperty("message", "lost the file for " + JSON.string(attachment, "name"));
                        messages.add(message);
                    }
                }
            }
            String summary = string(object, "summary");
            String description = string(object, "description");
            String links = string(object, "links");
            if (links == null) {
                if (nully(description)) {
                    System.out.println(formatIdentity(object) + ": has no description");
                    JsonObject message = new JsonObject();
                    message.addProperty("id", JSON.string(object, "_id"));
                    message.addProperty("chapter", JSON.string(object, "chapter"));
                    message.addProperty("topic", JSON.string(object, "topic"));
                    message.addProperty("message", ": has no description");
                    messages.add(message);
                }
                else if (!nully(description) && nully(summary)) {
                    System.out.println(formatIdentity(object) + ": has no summary");
                    JsonObject message = new JsonObject();
                    message.addProperty("id", JSON.string(object, "_id"));
                    message.addProperty("chapter", JSON.string(object, "chapter"));
                    message.addProperty("topic", JSON.string(object, "topic"));
                    message.addProperty("message", ": has no summary");
                    messages.add(message);
                }
            }
        }
        return messages;
    }

    private boolean nully(String value) {
        return value == null || value.trim().length() == 0;
    }

    private String formatIdentity(JsonObject object) {
        return JSON.string(object, "_id") + ": " + JSON.string(object, "chapter") + "/" + JSON.string(object, "topic");
    }

    public synchronized JsonArray list(String subject, String chapter) {
        Bson filter = chapter != null
            ? Filters.and(Filters.eq("instance", instance()), Filters.eq("subject", subject), Filters.eq("chapter", chapter))
            : Filters.and(Filters.eq("instance", instance()), Filters.eq("subject", subject));

        JsonArray list = new JsonArray();
        for (Document doc : cards().find(filter)) {
            String ch = doc.getString("chapter");
            String topic = doc.getString("topic");
            if (ch == null || topic == null || "_".equals(topic))
                continue;
            JsonObject line = new JsonObject();
            line.addProperty("subject", subject);
            line.addProperty("chapter", ch);
            line.addProperty("topic", topic);
            list.add(line);
        }
        return list;
    }

    private void addProperty(String[] dirs, String name, JsonElement element) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("subject", dirs[0]),
            Filters.eq("chapter", dirs[1]),
            Filters.eq("topic", dirs[2])
        );
        Object bsonVal = (element == null || element.isJsonNull()) ? null
                : element.isJsonPrimitive() ? (element.getAsJsonPrimitive().isBoolean() ? element.getAsBoolean()
                    : element.getAsJsonPrimitive().isNumber() ? element.getAsNumber() : element.getAsString())
                : Document.parse(element.toString());
        cards().updateOne(filter, Updates.set(name, bsonVal));
    }

    public int batchCards(String json) {
        JsonObject batch = MongoConnection.getGson().fromJson(json, JsonObject.class);
        json = string(batch, "json");
        batch = MongoConnection.getGson().fromJson(json, JsonObject.class);
        JsonArray properties = batch.getAsJsonArray("properties");
        JsonArray cards = batch.getAsJsonArray("cards");
        int count = 0;
        for (JsonElement element : cards) {
            JsonObject card = (JsonObject)element;
            String[] path = {
                    string(card, "subject"),
                    string(card, "chapter"),
                    string(card, "topic")
            };
            for (JsonElement elefant : properties) {
                JsonObject property = (JsonObject)elefant;
                String name = string(property, "name");
                JsonElement value = property.get("value");
                addProperty(path, name, value);
            }
            count++;
        }
        return count;
    }

    static class WeightedSum {
        int sum = 0;
        int count = 0;
        int target = 0;

        WeightedSum() {
        }

        WeightedSum(int value) {
            add(value);
        }

        public WeightedSum add(WeightedSum add) {
            this.sum += add.sum;
            this.count += add.count;
            return this;
        }

        public void add(int value) {
            this.sum += value;
            this.count ++;
        }

        public void target(int target) {
            this.target += target;
        }

        public int getSum() {
            return sum;
        }

        public int getCount() {
            return count;
        }

        public int getTarget() {
            return target;
        }

        float average() {
            return count != 0 ? (float)sum / (float)count : 0;
        }

        @Override
        public String toString() {
            return sum + " / " + count + " = " + average();
        }
    }
}
